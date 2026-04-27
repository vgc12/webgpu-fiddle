# Templates

Templates are the starting point for every shader in WebGPU Fiddle. Each template provides a set of default shaders and render settings that you can modify in the editor.

## Template Types

There are two types of template, each backed by a different rendering pipeline.

### Canvas Templates

Canvas templates render a full-screen triangle and run a **vertex shader** and a **fragment shader**. There is no compute stage. These are ideal for full-screen effects like fractals, ray marching, and post-processing.

The default vertex shader draws an oversized triangle that covers the entire viewport. In most cases, you only need to edit the fragment shader.

**Editor tabs:** Vertex, Fragment

### Particle Templates

Particle templates add a **compute shader** on top of the vertex and fragment stages. The compute shader runs every frame before rendering, reading from an input buffer and writing to an output buffer. After each frame, the buffers swap (ping-pong double buffering), so the output of one frame becomes the input of the next.

Each particle is an instance. The vertex shader reads particle data from the input buffer and positions geometry for each instance. The fragment shader colors it.

**Editor tabs:** Compute, Vertex, Fragment, Background (when a background shader is present)

## Built-in Templates

### Blank Canvas

- **Shader type:** Canvas
- **Use case:** Full-screen effects, learning WGSL basics

A minimal starting point. The vertex shader draws a full-screen triangle and the fragment shader returns the fragment coordinate as a color.

#### Vertex Shader

```wgsl
const triangleVertices: array<vec2f, 3> = array<vec2f, 3>(
    vec2f(-5, -5),
    vec2f(0,  5),
    vec2f(5, -5),
);
```

This defines three vertices that form a triangle far larger than the screen (coordinates go to -5 and 5, well beyond the -1 to 1 clip space range). This is intentional: by making the triangle oversized, it guarantees every pixel on the screen is covered, regardless of aspect ratio. The GPU clips the triangle to the viewport automatically. This is a common technique for full-screen effects since it avoids the diagonal seam that can appear when using two triangles to form a quad.

The `@builtin(vertex_index)` input tells the shader which of the three vertices it is currently processing (0, 1, or 2), and it uses that to look up the position from the array.

#### Fragment Shader

```wgsl
@fragment
fn fragmentMain(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    return fragCoord;
}
```

The fragment shader receives `fragCoord`, which is the pixel position of the current fragment. The `x` and `y` components are in pixel coordinates (e.g., 0 to 1920), and `z` is the depth value. Returning this directly as a color means the red channel increases from left to right and the green channel increases from top to bottom. Values above 1.0 are clamped, so most of the screen appears yellow or white. This is just a placeholder to show something is rendering.

---

### Canvas SDF

- **Shader type:** Canvas
- **Use case:** 3D rendering without meshes, procedural geometry

A ray marching demo that renders a 3D scene made entirely from math, with no mesh data. The scene consists of an infinite grid of pipes with spheres flowing through them.

#### How Ray Marching Works

Instead of rasterizing triangles, ray marching fires a ray from the camera through each pixel and "marches" along it in steps. At each step, it asks: "how far am I from the nearest surface?" This distance is computed by a **signed distance function** (SDF), which returns a positive value when outside an object and a negative value when inside.

The marching loop takes steps equal to the SDF distance (since that's guaranteed to be safe without missing any surface), and stops when the distance is very small (a hit) or the ray has traveled too far (a miss):

```wgsl
for (i = 0; i < 80; i++) {
    p = ro + rd * t;
    let d: f32 = sceneD(p);
    t += d;
    if (d < .001 || t > 100.) { break; }
}
```

- `ro` is the ray origin (camera position, at the world origin)
- `rd` is the ray direction (computed from the pixel's UV coordinate and the field of view)
- `t` accumulates the total distance traveled along the ray
- 80 iterations is the maximum; most rays converge much sooner

#### SDF Primitives

The scene is built from a few basic distance functions combined together:

- **`sdSphere(p, radius)`** returns `length(p) - radius`. The distance from a point to a sphere's surface is just the distance to the center minus the radius.
- **`sdfBox(p, b)`** computes the distance to an axis-aligned box. It works by folding the point into the positive octant with `abs(p)` and then measuring how far it is from the box extents.
- **`sdCapsule(p, a, b, r)`** computes the distance to a line segment (from point `a` to point `b`) thickened by radius `r`. It projects the point onto the segment using `clamp(dot(...), 0, 1)` and measures the remaining distance.

#### Smooth Blending with `smin`

Normally, combining two SDFs with `min(a, b)` gives a sharp crease where they meet. The `smin` function blends them smoothly instead, controlled by the parameter `k`:

```wgsl
fn smin(a: f32, b: f32, k: f32) -> f32 {
    let h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * h * k * (1.0 / 6.0);
}
```

This creates the smooth, organic look where the pipes merge into the boxes at each grid junction.

#### Infinite Repetition

The scene uses `fract(p / 2.0) * 2.0 - 1.0` to repeat the geometry infinitely in all directions. This maps any point in space into a local cell that ranges from -1 to 1, so the SDF only needs to define one cell's worth of geometry and it tiles everywhere.

#### Moving Spheres

Spheres travel along the pipe axes. The `axisSphere` function offsets the position by `time * speed` before applying the repetition, so the sphere appears to slide along the pipe. Each cell uses a pseudo-random hash (`rand3`) to decide its speed (or whether a sphere spawns at all), giving the scene variety.

#### Camera Control

The mouse controls the camera. The mouse position is converted to rotation angles and applied to the ray direction using 2D rotation matrices (`rot2D`). The vertical mouse position rotates around the X axis, and the horizontal position rotates around the Y axis.

#### Shading

When a ray hits a surface, `calcShading` computes the final color:

1. **Surface normal**: Estimated numerically by sampling the SDF at six nearby points and taking the gradient. This is the standard technique for SDF normals.
2. **Material**: The `scene` function returns a material ID alongside the distance. A value of 0 means pipe, 1 means sphere. This is used to blend between two colors.
3. **Lighting**: Two lights orbit the scene. For each, the shader computes diffuse lighting (`dot(normal, lightDir)`) with distance attenuation. One light is warm (orange-white), the other is cool (blue).
4. **Specular**: A specular highlight is computed using the reflection of the ray direction, raised to a power for sharpness.
5. **Ambient occlusion**: Approximated using the ray march iteration count. Points that took more steps to reach are in tighter crevices, so they get darkened.
6. **Fog**: Objects further from the camera fade into the background color, giving a sense of depth.

---

### Julia Set

- **Shader type:** Canvas
- **Use case:** Fractals, complex math visualization

An animated Julia set fractal. Each pixel is treated as a complex number and iterated through `z = z^2 + c` until it escapes or reaches the iteration limit.

#### The Julia Set Algorithm

A Julia set is defined by a constant `c` in the complex plane. For each pixel, the shader:

1. Maps the pixel coordinate to a complex number `z` (centered on the origin, scaled by a zoom factor).
2. Repeatedly applies `z = z^2 + c`. In WGSL, since there is no native complex type, this is done with real components:

```wgsl
z = vec2f(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
```

This comes from complex multiplication: if `z = a + bi`, then `z^2 = (a^2 - b^2) + (2ab)i`.

3. If `dot(z, z) > 4.0` (i.e., `|z|^2 > 4`), the point has "escaped" to infinity. Mathematically, once `|z| > 2` it will never come back, so 4 is used as the squared threshold.
4. If it reaches 300 iterations without escaping, the point is considered part of the set and colored black.

#### Animation

The constant `c` is animated over time using trigonometric functions:

```wgsl
let c = vec2f(
    0.355 + 0.1 * sin(t * 0.7) + 0.05 * cos(t * 1.3),
    0.355 + 0.1 * cos(t * 0.9) + 0.05 * sin(t * 1.1)
);
```

This traces a smooth, looping path through the complex plane. Different values of `c` produce dramatically different fractal patterns, and slowly varying it creates a morphing effect.

#### Smooth Coloring

Rather than using the raw integer iteration count (which produces visible banding), the shader computes a smooth iteration count:

```wgsl
let sl = f32(i) - log2(log2(dot(z, z))) + 4.0;
```

This corrects for how far past the escape threshold the point traveled, producing a continuous value that removes the staircase effect. The result is mapped to a color using a cosine palette (`0.5 + 0.5 * cos(...)`) which cycles through hues smoothly.

---

### Blank Particle

- **Shader type:** Particle
- **Default particle count:** 2,500
- **Particle struct:** `position: vec2<f32>`
- **Use case:** Starting point for custom particle simulations

A minimal particle template that arranges particles in a grid. Provides the scaffolding for building your own compute-driven simulations.

#### Compute Shader

The compute shader runs once per particle. It calculates a grid position from the particle's index:

```wgsl
let count = arrayLength(&input);
let cols = u32(ceil(sqrt(f32(count))));
let row = index / cols;
let col = index % cols;

let x = (f32(col) + 0.5) / f32(cols);
let y = (f32(row) + 0.5) / f32(cols);

output[index].position = vec2<f32>(x, y);
```

This computes the number of columns needed to arrange all particles into a roughly square grid (`ceil(sqrt(count))`), then derives each particle's row and column from its 1D index using integer division and modulo. The `+ 0.5` centers each particle within its grid cell, and dividing by `cols` normalizes positions to the 0-1 range.

#### Vertex Shader

The vertex shader positions a small quad for each particle instance:

```wgsl
let sizeInPixels = 4.0;
let posInPixels = particlePos * resolution;
let offsetInPixels = squareArray[vertexIndex] * sizeInPixels;
let finalPosInPixels = posInPixels + offsetInPixels;
```

Each particle's 0-1 position is converted to pixel coordinates, then a 4-pixel quad is drawn around it using the `squareArray` (6 vertices forming 2 triangles). The final pixel position is converted back to clip space (-1 to 1) for the GPU.

The color is derived from the particle's position: the red channel is the x coordinate and the green channel is the y coordinate.

#### Fragment Shader

The fragment shader simply passes through the color from the vertex shader. This is the simplest possible fragment shader for particles.

---

### Rain

- **Shader type:** Particle
- **Default particle count:** 5,000
- **Particle struct:** `position: vec2<f32>, velocity: vec2<f32>`
- **Use case:** Weather effects, interactive demos

A rain simulation with depth-layered drops, mouse repulsion, and streaked rendering. Particles fall at varying speeds depending on their depth layer and are pushed away by the cursor.

#### Compute Shader: Rain Physics

The compute shader simulates each raindrop every frame. Each particle gets deterministic random properties seeded by its index using a hash function:

```wgsl
let r1 = hash(index * 3u + 1u);   // fall speed variation
let r2 = hash(index * 7u + 3u);   // horizontal drift
let r3 = hash(index * 13u + 5u);  // depth layer
```

**Depth layers:** Each particle has a depth layer between 0.3 (far/slow) and 1.0 (close/fast). This affects fall speed, streak size, and brightness, creating a parallax depth effect.

**Fall velocity:** Particles fall with a base speed scaled by their depth layer, plus slight horizontal drift to simulate wind. The velocity uses `mix()` to smoothly approach the target, giving inertia after mouse interaction.

**Mouse repulsion:** The mouse position is converted to normalized coordinates. Particles within a radius of the cursor are pushed away with a force proportional to proximity, scaled by the depth layer so closer particles react more strongly.

**Respawn:** When a particle falls below the bottom edge, it respawns above the top with a randomized x position and staggered y offset (to avoid visible horizontal lines of simultaneous respawns). Horizontal wrapping keeps particles on screen.

**Delta time:** The shader uses the `deltaTime` uniform for frame-rate-independent simulation.

#### Vertex Shader: Streaked Drops

Each raindrop is rendered as an elongated quad aligned with its velocity direction:

```wgsl
let streakLen = max(speed * 50.0, 4.0) * layer;
```

The streak length scales with speed and depth layer, so faster/closer drops appear as longer streaks. The quad's local x-axis is the perpendicular direction (width) and y-axis is the velocity direction (length). The vertex shader uses the same hash function as the compute shader to determine each particle's depth layer, ensuring size and brightness match speed.

#### Fragment Shader: Soft Fade

The fragment shader applies a soft tapered fade using smoothstep:

```wgsl
let fadeX = 1.0 - smoothstep(0.3, 1.0, abs(quadUV.x));
let fadeY = 1.0 - smoothstep(0.4, 1.0, abs(quadUV.y));
```

This creates thin streaks with tapered tips. Since alpha blending is not available, the color is multiplied by the fade value (pre-multiplied alpha technique), which looks identical to transparency on a black background.

---

### Game of Life

- **Shader type:** Particle
- **Default particle count:** 1,048,576 (1024 x 1024 grid)
- **Particle struct:** `state: u32`
- **Use case:** Cellular automata, grid-based simulations

Conway's Game of Life running entirely on the GPU. Each "particle" is actually a cell in a 2D grid, with a state of either alive (1) or dead (0).

#### Compute Shader: Cellular Automaton

The compute shader uses a 2D workgroup size `(8, 8, 1)` since this is a 2D grid simulation. Each thread handles one cell.

**Grid indexing:**

The 1D buffer is treated as a 2D grid by deriving the grid size from the total count:

```wgsl
fn gridSize() -> u32 {
    return u32(sqrt(f32(arrayLength(&input))));
}
```

Since the particle count is 1024 x 1024, this gives a 1024-wide grid.

**Neighbor lookup with wrapping:**

```wgsl
fn getCell(x: i32, y: i32) -> u32 {
    let gs = i32(gridSize());
    let wx = ((x % gs) + gs) % gs;
    let wy = ((y % gs) + gs) % gs;
    return input[u32(wy) * gridSize() + u32(wx)].state;
}
```

The double-modulo pattern `((x % gs) + gs) % gs` handles negative indices correctly (WGSL's `%` can return negative values for negative inputs). This makes the grid wrap around, so cells on the left edge see the right edge as their neighbor, creating a toroidal topology.

**Conway's rules:**

The shader counts all 8 neighbors and applies the classic rules:
- A live cell with 2 or 3 neighbors survives; otherwise it dies.
- A dead cell with exactly 3 neighbors becomes alive.

```wgsl
if (current == 1u) {
    output[index].state = select(0u, 1u, neighbors == 2u || neighbors == 3u);
} else {
    output[index].state = select(0u, 1u, neighbors == 3u);
}
```

The `select(falseVal, trueVal, condition)` function is WGSL's branchless ternary, equivalent to `condition ? trueVal : falseVal`.

#### Vertex Shader: Grid Rendering

Each cell is drawn as a quad (6 vertices, 2 triangles). The vertex shader computes each cell's pixel position from its 1D instance index:

```wgsl
let cellX = instanceIndex % gs;
let cellY = instanceIndex / gs;
```

The cell size is calculated to fit the smaller viewport dimension, and the grid is centered in the viewport. Alive cells are colored green, dead cells are dark gray. The color is determined in the vertex shader (not the fragment shader) since it's the same for all pixels in the cell.

#### Fragment Shader

The fragment shader simply outputs the color passed from the vertex shader. No per-pixel computation is needed since each cell is a solid color.

## How Templates Work

A template is defined by four things:

| Field | Description |
|---|---|
| `shaderType` | `"canvas"` or `"particle"`, determines which renderer is used |
| `shaderConfig` | The default source code for each shader stage (vertex, fragment, compute, and optional background) |
| `defaultRenderSettings` | Vertex draw count, instance count, and optional initial data |
| `name` / `description` | Display name and description shown in the template selector |

When you select a template:

1. The editor loads the default shader source for each stage.
2. The renderer is created based on `shaderType` (CanvasRenderer or ParticleRenderer).
3. Render settings are applied (how many vertices per draw call, how many instances).
4. For particle templates, the compute shader's struct definition is parsed to set up GPU buffers with the correct layout.

## Compute Shader Conventions

If you're writing or modifying a particle template's compute shader, follow these conventions:

### Struct and buffer bindings

Define your particle struct and declare the input/output storage buffers:

```wgsl
struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
}

@group(0) @binding(1) var<storage, read> input: array<Particle>;
@group(0) @binding(2) var<storage, read_write> output: array<Particle>;
```

The buffer bindings must use `@binding(1)` for input and `@binding(2)` for output. `@binding(0)` is reserved for uniforms.

### Custom structs

You can define any struct you want for the input/output buffers. The app automatically parses the struct definition from your compute shader and uses it to allocate GPU buffers with the correct size and memory layout.

For example, if you define:

```wgsl
struct Boid {
    position: vec2<f32>,
    velocity: vec2<f32>,
    mass: f32,
}
```

The app will parse `Boid`, calculate each field's byte size, alignment, and offset according to the WebGPU spec, and allocate a buffer large enough to hold one `Boid` per particle instance.

#### Supported types

The following WGSL types are supported in custom structs:

| Type | Size | Alignment |
|---|---|---|
| `f32`, `i32`, `u32` | 4 bytes | 4 bytes |
| `f16` | 2 bytes | 2 bytes |
| `vec2<f32>`, `vec2f`, `vec2i`, `vec2u` | 8 bytes | 8 bytes |
| `vec3<f32>`, `vec3f`, `vec3i`, `vec3u` | 12 bytes | 16 bytes |
| `vec4<f32>`, `vec4f`, `vec4i`, `vec4u` | 16 bytes | 16 bytes |
| `mat2x2<f32>`, `mat2x2f` | 16 bytes | 8 bytes |
| `mat3x3<f32>`, `mat3x3f` | 48 bytes | 16 bytes |
| `mat4x4<f32>`, `mat4x4f` | 64 bytes | 16 bytes |

Note that `vec3` types have 16-byte alignment despite being only 12 bytes. This means there will be 4 bytes of padding after a `vec3` field. The app handles this automatically.

#### Automatic random initialization

When no initial data is provided, the buffer is filled with random values based on each field's type:

- **`f32` fields**: Random values in the range -1 to 1
- **`u32` and `i32` fields**: Either 0 or 1 (with roughly 35% chance of being 1)

This means you can write a compute shader with a new struct and immediately see results without needing to set up any data. The random initialization works per-component, so a `vec2<f32>` gets two independent random values.

#### Providing your own initial data

You can override the random initialization by uploading a JSON file through the **Settings** dialog in the toolbar. The JSON should be an array with one entry per particle.

For a struct with **multiple fields**, each entry should be an object with fields indexed by position. For a struct like:

```wgsl
struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
}
```

The JSON would look like:

```json
[
    { "0": [0.5, 0.5], "1": [0.0, 0.1] },
    { "0": [0.3, 0.7], "1": [0.1, 0.0] }
]
```

Where `"0"` maps to the first field (`position`) and `"1"` maps to the second field (`velocity`). Vector values are arrays of components.

For a struct with a **single field**, the entries are values directly:

```json
[1, 0, 1, 0, 1]
```

If the JSON array has fewer entries than the particle count, the remaining particles are initialized to zero.

### Workgroup size

Declare your workgroup size with the `@workgroup_size` attribute:

```wgsl
@compute @workgroup_size(64, 1, 1)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
    // ...
}
```

The workgroup size is parsed from your shader code and used to calculate dispatch dimensions automatically. For 1D simulations (particles), a workgroup size of `(64, 1, 1)` is typical. For 2D grids (Game of Life), use something like `(8, 8, 1)`.

### Bounds checking

Always check that the invocation index is within bounds:

```wgsl
let index = global_id.x;
if (index >= arrayLength(&input)) {
    return;
}
```

This prevents out-of-bounds writes when the particle count is not a perfect multiple of the workgroup size.

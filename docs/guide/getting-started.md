# Getting Started

## Prerequisites

- **Node.js** (v18 or later)
- A browser with **WebGPU support** (Chrome 113+, Edge 113+, Firefox 141+, or their derivatives)
- A **relatively modern GPU** with up-to-date drivers (integrated graphics on recent CPUs will work for simpler shaders, but a discrete GPU is recommended for compute-heavy templates like Game of Life)

::: tip
To check if your browser supports WebGPU, open the developer console and run `navigator.gpu`. If it returns `undefined`, your browser does not support WebGPU.
:::

::: tip Linux users
For the best WebGPU experience on Linux, launch your browser with the Vulkan backend:

**Chromium-based browsers:**
```bash
google-chrome --enable-features=Vulkan
# or
chromium --enable-features=Vulkan
```

**Firefox-based browsers (Firefox, Zen, LibreWolf, etc.):**
```bash
MOZ_ENABLE_VULKAN=1 firefox
# or
MOZ_ENABLE_VULKAN=1 zen-browser
```

Without this, your browser may fall back to an OpenGL-based backend that has limited WebGPU support or lower performance.
:::

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/vgc12/webgpu-fiddle.git
cd webgpu-fiddle
npm install
```

Start the development server:

```bash
npm run dev
```

Then open the URL shown in your terminal (usually `http://localhost:5173`).

## Choosing a Template

When you first open the app, you'll see the **Template Selector**. Pick a template to get started:

| Template | Description |
|---|---|
| **Blank Canvas** | Empty vertex and fragment shader, a clean slate |
| **Canvas SDF** | Ray marched signed distance field demo |
| **Julia Set** | Animated Julia set fractal |
| **Blank Particle** | Empty particle template with input/output buffers |
| **Rain** | Compute-driven rain simulation with mouse interaction |
| **Game of Life** | Conway's Game of Life via compute shader |

**Canvas** templates use vertex and fragment shaders only. **Particle** templates add a compute shader stage for GPU-driven simulation with ping-pong double buffering, and an optional background shader for rendering behind the particles.

## The Workspace

After selecting a template, the workspace opens with two panels:

- **Left** - The WebGPU rendering canvas, showing your shader output in real time.
- **Right** - The Monaco code editor with tabs for each shader stage (vertex, fragment, and compute if applicable).

### Toolbar

The toolbar at the top provides:

- **Compile** - Recompile and apply your shader changes. You can also press `Ctrl+Enter` (`Cmd+Enter` on macOS) in the editor.
- **Template** - Switch to a different template.
- **Settings** - Open render settings (vertex draw count, instance count, initial particle data).
- **Download** - Export your shaders as a `.zip` file.
- **Upload** - Import previously downloaded shaders from a `.zip` file.
- The sun/moon icon toggles **dark mode**.

## Writing Your First Shader

1. Select the **Blank Canvas** template.
2. Switch to the **Fragment** tab in the editor.
3. Try replacing the fragment shader body with something like:

```wgsl
@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / resolution;
    return vec4f(uv, 0.5 + 0.5 * sin(time), 1.0);
}
```

4. Press `Ctrl+Enter` to compile. The canvas should show a color gradient that shifts over time.

### Available Uniforms

The following uniforms are automatically injected into every shader. You can use them directly as global variables:

| Variable | Type | Description |
|---|---|---|
| `resolution` | `vec2f` | Canvas width and height in pixels |
| `mousePosition` | `vec2f` | Current mouse position in pixels |
| `aspectRatio` | `f32` | Canvas width divided by height |
| `time` | `f32` | Elapsed time in seconds |
| `deltaTime` | `f32` | Seconds elapsed since the previous frame |

## Render Settings

Click **Settings** in the toolbar to adjust:

- **Vertex Draw Count** - Number of vertices per draw call (3 for a full-screen triangle, 6 for a quad).
- **Particle Count** - Number of instances for particle templates.
- **Initial Particle Data** - Upload a JSON array to initialize particle buffer data.

## Next Steps

- Try the **Canvas SDF** template to explore ray marching techniques.
- Open the **Rain** template to see how compute shaders drive particle simulation with mouse interaction.
- Experiment with the **Game of Life** template to learn about cellular automata on the GPU.

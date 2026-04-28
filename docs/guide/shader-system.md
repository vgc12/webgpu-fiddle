# Shader System

This page explains how WebGPU Fiddle processes your shader code behind the scenes, from what you type in the editor to what runs on the GPU.

## Overview

When you write a shader in the editor, you are writing **user code**. This is not the exact code that gets sent to the GPU. Before compilation, the app transforms your code in two ways:

1. **Uniform injection** - The uniform struct, bindings, and convenience variables are prepended and injected into every entry point function.
2. **Documentation comments** - Helpful comments describing available variables are prepended to the editor content.

This means you can use variables like `time`, `resolution`, and `mousePosition` directly in any shader function without declaring them yourself.

## Uniform Injection

Every shader (vertex, fragment, and compute) gets the same uniform block injected automatically. The raw uniform code that gets prepended looks like this:

```wgsl
struct Uniforms {
    resolution : vec2f,
    mousePosition: vec2f,
    aspectRatio: f32,
    time: f32,
    deltaTime: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

var<private> resolution: vec2f;
var<private> mousePosition: vec2f;
var<private> aspectRatio: f32;
var<private> time: f32;
var<private> deltaTime: f32;
```

The `var<private>` declarations are module-scope copies of the uniform values. They exist so you can write `resolution` instead of `uniforms.resolution` in your code.

These private variables are populated at the start of every entry point function. The app finds all functions marked with `@compute`, `@vertex`, or `@fragment` and injects assignment statements right after the opening brace:

```wgsl
resolution = uniforms.resolution;
mousePosition = uniforms.mousePosition;
aspectRatio = uniforms.aspectRatio;
time = uniforms.time;
deltaTime = uniforms.deltaTime;
```

So if you write:

```wgsl
@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    return vec4f(sin(time), 0.0, 0.0, 1.0);
}
```

The code that actually compiles is:

```wgsl
struct Uniforms { ... }
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
var<private> time: f32;
// ... other declarations ...

@fragment
fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    time = uniforms.time;
    // ... other assignments ...
    return vec4f(sin(time), 0.0, 0.0, 1.0);
}
```

### What this means for you

- **Do not** declare your own `Uniforms` struct or `@group(0) @binding(0)` binding. It will conflict with the injected one.
- **Do not** declare `var<private>` variables named `resolution`, `mousePosition`, `aspectRatio`, `time`, or `deltaTime`. They are already declared.
- You **can** access the struct directly as `uniforms.resolution` if you prefer, but the shorthand variables are available in any entry point.
- For particle templates, `@binding(1)` and `@binding(2)` are reserved for the input and output storage buffers.

## Compilation Pipeline

When you press `Ctrl+Enter` (or click Compile), the following happens:

1. **Injection** - `injectUniformsIntoShader()` is called on each shader stage (vertex, fragment, compute, and background if present). This prepends the uniform block and injects the assignment statements into every entry point.

2. **Validation** - Each shader is compiled via `device.createShaderModule()` and `getCompilationInfo()` is called to check for errors. If any errors are found, they are displayed in the editor and compilation stops.

3. **Line mapping** - Error line numbers from the GPU compiler refer to the full injected code, not your user code. The validator maps these back to your original line numbers by subtracting the prefix length and injection offsets. This means error squiggles appear on the correct lines in the editor.

4. **Recompilation** - If validation passes, the renderer's `recompileShaders()` method is called with the new shader code. This rebuilds the GPU pipelines with the updated shaders.

### Live validation

In addition to compile-on-demand, the editor runs **debounced live validation** as you type. Every 500ms after you stop typing, the current tab's shader is validated in the background. Errors and warnings appear in the editor without needing to hit compile. This only validates the active tab, not all three at once.

## Struct Parsing

For particle templates, the app needs to understand the structure of your data to allocate GPU buffers correctly. It does this by parsing WGSL struct definitions directly from your compute shader source.

The parser (`parseAllStructsFromWGSL`) uses regex to find all `struct` blocks and extract their fields. For each field, it looks up the type in a table of known WGSL types to determine:

- **Size** - How many bytes the field occupies
- **Alignment** - The byte boundary the field must start on
- **Offset** - The computed byte position within the struct

The struct's total size is padded to a multiple of its largest member's alignment, following the WebGPU spec.

### Buffer binding resolution

When the app needs to know the struct type for the input/output buffers, it uses `getStructFromBufferBinding()`. This function:

1. Parses all structs from the shader.
2. Finds the `@binding` declaration for the named variable (e.g., `input`).
3. Extracts the type from the declaration (handling `array<T>` wrappers).
4. Returns the matching parsed struct.

For example, given:

```wgsl
struct Boid { position: vec2f, heading: f32, }
@group(0) @binding(1) var<storage, read> input: array<Boid>;
```

Calling `getStructFromBufferBinding(code, 'input')` returns the parsed `Boid` struct with fields, sizes, and offsets.

## Editor Documentation

When a template loads, each shader tab gets auto-generated documentation comments prepended to the code. These comments list the variables available in that shader stage:

**Compute shaders:**
```
// global_id: vec3<u32> - Global invocation ID across all workgroups
// local_id: vec3<u32> - Local invocation ID within the workgroup
// workgroup_id: vec3<u32> - Which workgroup this invocation is in
```

**Vertex shaders:**
```
// vertexIndex: u32 - Index of the current vertex
// instanceIndex: u32 - Index of the current instance
// output: VertexOutput - Set output.position and output.color
```

Particle vertex shaders also show `particlePos` and `particleVel`.

**Fragment shaders:**
```
// fragCoord: vec4<f32> - Fragment coordinates
// Return: vec4<f32> - Output color for this fragment
```

**Background shaders** (particle templates only) show the same variables as fragment shaders.

All stages include the uniform variable documentation (resolution, mousePosition, aspectRatio, time, deltaTime).

## Download and Upload

You can export and import your shaders as `.zip` files using the toolbar buttons.

**Download** creates a zip with:
- `vertex.wgsl`
- `fragment.wgsl`
- `compute.wgsl` (particle templates only)
- `background.wgsl` (particle templates with a background shader)

**Upload** accepts a zip file and matches filenames by keyword. Any file with `vert` in the name loads as the vertex shader, `frag` as fragment, `compute` as compute, and `background` as the background shader. This is case-insensitive, so `myVertexShader.wgsl` or `VERT.txt` would both match.

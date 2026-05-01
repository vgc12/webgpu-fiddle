[//]: <> (AI was used in the making of this file for layout. Has been reviewed multiple times for accuracy)
# Getting Started

## Prerequisites

- **Node.js** (v18 or later)
- A browser with **WebGPU support** (Chrome 113+, Edge 113+, Firefox 141+, or their derivatives). **Safari** may work but WebGPU may need to be enabled manually first (see the Safari tip below). If in doubt, use Chrome, Edge, or Firefox.
- A **GPU** with up-to-date drivers. Any GPU that the browser exposes to WebGPU will work, including **integrated graphics** (Intel UHD/Iris, AMD Radeon Graphics, Apple Silicon, etc.). A discrete GPU is not required. Compute-heavy templates like Game of Life will simply run at lower frame rates on weaker integrated GPUs.

::: tip
To check if your browser supports WebGPU, open the developer console and run `navigator.gpu`. If it returns `undefined`, your browser does not support WebGPU.
:::

::: tip Linux users
For the best WebGPU experience on Linux, launch your browser with the Vulkan backend, :

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

Firefox users will also need to enable WebGPU itself: open `about:config`, search for `dom.webgpu.enabled`, and set it to `true`.
:::

::: warning Firefox + Linux + NVIDIA
The combination of **Firefox on Linux with an NVIDIA GPU** is known to have issues running this project out of the box. The canvas may fail to render, render incorrectly, or crash the tab. If you hit this:

- Launch Firefox with the Vulkan backend as shown above (`MOZ_ENABLE_VULKAN=1 firefox`).
- Make sure the proprietary NVIDIA drivers are installed and up to date (the open `nouveau` driver does not have working WebGPU support).
- If it still doesn't work, use a Chromium-based browser (Chrome, Chromium, Edge, Brave, etc.) instead, those have more reliable WebGPU support on Linux + NVIDIA.
:::

::: tip Safari users
WebGPU may not be enabled by default in Safari. To enable it:

1. Open Safari and go to **Settings > Advanced**, then check **Show features for web developers** (or **Show Develop menu in menu bar** on older versions).
2. Open the **Develop** menu, then go to **Feature Flags** (or **Experimental Features** on older versions).
3. Find **WebGPU** in the list and enable it.
4. Restart Safari.

If WebGPU is still unavailable after enabling the flag, your Safari version may be too old. Use Chrome, Edge, or Firefox instead.
:::

## Using the App

If you just want to use WebGPU Fiddle, you don't need to install anything. The hosted version is available at **[webgpu.vercel.app](https://webgpu.vercel.app)**, just open it in a supported browser and start writing shaders.

## Installation (for development)

::: info
You only need this section if you want to **run the project locally** to add features, fix bugs, or contribute. To just use the app, visit [webgpu.vercel.app](https://webgpu.vercel.app) instead.
:::

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

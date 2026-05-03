# WebGPU Fiddle

A browser-based WebGPU shader editor and renderer. Write WGSL shaders in a Monaco editor with live preview, hot-reloading, and shareable URLs.

**[Live Demo](https://vgc12.github.io/webgpu-renderer/)** | **[Documentation](https://vgc12.github.io/docs/)**

## Features

- Tabbed WGSL editor with syntax highlighting and live error diagnostics
- Real-time WebGPU rendering with hot shader recompilation (Ctrl+Enter)
- Compute shader support with ping-pong double buffering
- Shareable URLs that encode your shader code
- Shader import/export as zip files
- Built-in templates to get started quickly

## Templates

| Template | Description |
|---|---|
| Blank Canvas | Empty full-screen vertex and fragment shader |
| Canvas SDF | Ray marching signed distance field demo |
| Julia Set | Animated Julia set fractal |
| Blank Particle | Empty particle template with compute input/output buffers |
| Rain | Compute-driven rain simulation with mouse interaction |
| Game of Life | Conway's Game of Life via compute shader |

## Getting Started

### Prerequisites

- Node.js 18+
- A browser with [WebGPU support](https://caniuse.com/webgpu) (Chrome 113+, Edge 113+, Firefox Nightly)

### Setup

```bash
git clone https://github.com/vgc12/webgpu-renderer.git
cd webgpu-renderer
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run deploy` | Deploy to GitHub Pages |
| `npm run docs:dev` | Start documentation dev server |
| `npm run docs:build` | Build documentation site |

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build:** Vite
- **Editor:** Monaco Editor
- **Styling:** Tailwind CSS v4, Radix UI
- **Graphics:** WebGPU / WGSL
- **Testing:** Vitest
- **Documentation:** VitePress

## Architecture

The rendering system uses a **Template Method + Strategy** pattern:

- **BaseWebGPURenderer** manages the lifecycle (init, animate, update, destroy)
- **StrategyBasedRenderer** delegates to four strategy interfaces: pipeline, resource, update, and render
- **CanvasRenderer** draws a full-screen quad with vertex/fragment shaders
- **ParticleRenderer** adds a compute stage with ping-pong double-buffered storage buffers

The shader system automatically injects uniform bindings (resolution, time, mouse position) into your WGSL entry points and remaps compilation errors back to your original code.

See the [Architecture Guide](https://vgc12.github.io/docs/guide/architecture.html) for details.

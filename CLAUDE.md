# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebGPU shader editor and renderer — a browser-based tool for writing WGSL shaders with live preview. Users edit
vertex/fragment/compute shaders in a Monaco editor and compile them to see results rendered via WebGPU.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint (`.ts` files)
- `npm run deploy` — Deploy to GitHub Pages via gh-pages

No test runner is configured.

## Path Alias

`@` maps to `./src` (configured in both `tsconfig.json` and `vite.config.ts`).

## Architecture

### Rendering Pipeline

The renderer uses **Template Method + Strategy** patterns:

1. **IRenderer** (`src/graphics/i-renderer.tsx`) — interface: `start()`, `stop()`, `recompileShaders()`, `destroy()`
2. **BaseWebGPURenderer** — abstract base managing lifecycle (init → animate → update → destroy), owns `WebGPUContext`,
   `GPUResourceManager`, `AnimationController`, `Time`
3. **StrategyBasedRenderer** — composes four strategy interfaces (`IPipelineStrategy`, `IResourceStrategy`,
   `IUpdateStrategy`, `IRenderStrategy`) defined in `rendering-strategies.tsx`
4. **Concrete renderers:**
    - **CanvasRenderer** — full-screen quad (6 vertices, no compute). Strategies in `canvas-strategies.tsx`
    - **ParticleRenderer** — compute shader updates particles with ping-pong double buffering, then renders. Strategies
      in `particle-strategies.tsx`

### Shader System

- Default `.wgsl` shaders live in `src/shaders/` and are imported as strings via `vite-plugin-string`
- `shader-builder.tsx` provides: `injectUniformsIntoShader()` (adds uniform struct + local variable assignments into
  entry point functions), `getWorkgroupSize()`, `getStructFromBufferBinding()`, WGSL struct parsing with
  alignment/offset calculation
- `ShaderConfig` type (`shader_config.tsx`): `{ vertexShader, fragmentShader, computeShader? }`
- `type-info.tsx` maps WGSL types to their byte sizes and alignments

### Buffer Management

- `UniformBuffer` — 16-byte buffer for resolution/aspect/time
- `InputOutputBuffers` — ping-pong double buffering for compute I/O with `swap()`
- `GPUResourceManager` — factory for buffers, shader modules, bind groups

### Pipeline Builders

`RenderPipelineBuilder` and `ComputePipelineBuilder` use a fluent builder API to construct GPU pipelines.

### UI Layer

- **app.tsx** — top-level state (shader type, active tab, user shader text), coordinates compilation and renderer
  recompilation via `rendererRef`
- **WebGPUCanvas** (`main-canvas.tsx`) — mounts canvas, creates renderer on init, exposes renderer ref to parent
- **MonacoEditor** (`src/monaco/`) — tab-based editor with custom WGSL language registration (`registerWGSL.tsx`)
- **Panel** — resizable container with drag-to-resize

## Naming Conventions (ESLint-enforced)

- Classes: `PascalCase`
- Methods/properties: `camelCase`
- Type aliases: `snake_case`
- Exported variables: `PascalCase`
- Static readonly: `UPPER_CASE`
- Local variables: `camelCase` or `UPPER_CASE`

## Notes

- All `.tsx` extension is used throughout, including non-React files in `graphics/`
- `@typescript-eslint/no-explicit-any` is disabled
- WGSL files get type declarations from `src/shader-module.d.ts`
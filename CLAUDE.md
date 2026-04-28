# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebGPU shader editor and renderer - a browser-based tool for writing WGSL shaders with live preview. Users pick a
template, edit vertex/fragment/compute shaders in a Monaco editor, and see results rendered via WebGPU in real time.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — TypeScript check (`tsc`) + Vite production build
- `npm run lint` — ESLint (`.ts` files)
- `npm run deploy` — Deploy to GitHub Pages via gh-pages
- `npm run test` — Run tests once (vitest)
- `npm run test:watch` — Run tests in watch mode (vitest)

## Path Alias

`@` maps to `./src` (configured in both `tsconfig.json` and `vite.config.ts`).

## Architecture

### App Flow

1. User selects a template from `TemplateSelector` (`src/components/template-selector.tsx`), which reads from the `TEMPLATES` array in `src/templates.tsx`
2. `App` passes the template's `ShaderConfig`, shader type, and render settings to `ShaderWorkspace`
3. `ShaderWorkspace` composes the Monaco editor and `WebGPUCanvas`, using `useShaderCompilation` hook for state
4. `WebGPUCanvas` (`src/components/ui/main-canvas.tsx`) creates the appropriate renderer and exposes it via ref

### Rendering Pipeline (Template Method + Strategy)

- **IRenderer** (`src/graphics/i-renderer.tsx`) — interface: `start()`, `stop()`, `resize()`, `recompileShaders()`, `destroy()`, readonly `device`
- **BaseWebGPURenderer** (`src/graphics/renderers/`) — abstract base managing lifecycle (init → animate → update →
  destroy), owns `WebGPUContext`, `GPUResourceManager`, `AnimationController`, `Time`
- **StrategyBasedRenderer** — composes four strategy interfaces (`IPipelineStrategy`, `IResourceStrategy`,
  `IUpdateStrategy`, `IRenderStrategy`) defined in `src/graphics/renderers/strategies/rendering-strategies.tsx`
- **CanvasRenderer** (`src/graphics/renderers/canvas-renderer.tsx`) — full-screen quad, no compute
- **ParticleRenderer** (`src/graphics/renderers/particle-renderer.tsx`) — compute + render with ping-pong double
  buffering

### Key Subsystems

- **Shader system** (`src/graphics/shaders/`) — `shader-builder.tsx` handles uniform injection into WGSL entry points,
  workgroup size parsing, and WGSL struct parsing with alignment/offset calculation. `shader-config.tsx` defines the
  `ShaderConfig` type. `shader-validator.tsx` validates shaders.
- **Pipeline builders** (`src/graphics/pipelines/`) — `RenderPipelineBuilder` and `ComputePipelineBuilder` use fluent
  builder APIs. `input-output-buffers.tsx` provides ping-pong double buffering with `swap()`.
- **Graphics utils** (`src/graphics/utils/`) — WGSL type info (byte sizes/alignments), vertex buffer layouts, fragment
  outputs, workgroup utilities
- **Templates** (`src/templates.tsx`) — `TEMPLATES` array of `template_def`, each specifying shader type, `ShaderConfig`,
  and default render settings (vertex draw count, instance count, initial data)
- **Hooks** (`src/hooks/`) — `useShaderCompilation` manages shader state, compilation, and renderer recompilation;
  `useDarkMode` and `buildInitialShaders` are also here
- **Utils** (`src/utils/`) — `Time` class for elapsed/delta time tracking, `shader-url-codec` for shareable URL
  encoding/decoding, general utilities
- **Editor** (`src/components/editor/monaco-editor.tsx`) — tab-based Monaco editor with WGSL language support
- **Default shaders** (`src/shaders/`) — `.wgsl` files imported as strings via `vite-plugin-string`, named as
  `{renderer}.{stage}.{template}.wgsl`

### Shared Types

`src/types.tsx` — `tab_id`, `render_settings`, `template_def`

## Naming Conventions (ESLint-enforced)

- Classes: `PascalCase`
- Methods/properties: `camelCase`
- Type aliases: `snake_case`
- Exported variables: `PascalCase`
- Static readonly: `UPPER_CASE`
- Local variables: `camelCase` or `UPPER_CASE`

## Style

- Never use em dashes (—) in code comments or text output. Use commas, periods, or parentheses instead.

## Notes

- `.tsx` extension is used throughout, including non-React files in `graphics/`
- `@typescript-eslint/no-explicit-any` is disabled
- WGSL files get type declarations from `src/shader-module.d.ts`
- UI uses Tailwind CSS v4 (via `@tailwindcss/vite`), Radix UI primitives, and `lucide-react` icons

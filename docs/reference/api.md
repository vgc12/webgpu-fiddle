# API Reference

Quick reference for all public functions, types, classes, and interfaces.

## Shaders

### Functions

#### `injectUniformsIntoShader`
```ts
function injectUniformsIntoShader(wgslCode: string): {
    code: string;
    prefixLineCount: number;
    injections: { atLine: number; linesAdded: number }[];
}
```
Prepends the uniform struct/bindings and injects uniform assignment statements into every `@vertex`, `@fragment`, and `@compute` entry point. Returns the transformed code along with metadata for mapping error line numbers back to user code.

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `validateShader`
```ts
function validateShader(
    device: GPUDevice,
    userCode: string,
    fullCode: string,
    label: string,
    prefixLineCount: number,
    injections: { atLine: number; linesAdded: number }[]
): Promise<shader_diagnostic[]>
```
Compiles the shader on the GPU and returns diagnostics with line numbers remapped to the user's original code.

**Source:** `src/graphics/shaders/shader-validator.tsx`

---

#### `getWorkgroupSize`
```ts
function getWorkgroupSize(computeShader: string): [number, number, number]
```
Parses the `@workgroup_size(x, y, z)` attribute from a compute shader. Returns `[64, 1, 1]` if not found.

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `parseAllStructsFromWGSL`
```ts
function parseAllStructsFromWGSL(wgslCode: string): Map<string, StructInfo>
```
Finds all `struct` definitions in WGSL code and returns a map of struct name to parsed field information (types, sizes, alignments, offsets).

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `parseStructFromWGSL`
```ts
function parseStructFromWGSL(wgslCode: string, structName: string): StructInfo | null
```
Parses a single struct definition by name. Returns `null` if the struct is not found.

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `getStructFromBufferBinding`
```ts
function getStructFromBufferBinding(wgslCode: string, bindingName: string): StructInfo | null
```
Finds the `@binding` declaration for the given variable name, extracts its type (unwrapping `array<T>` if needed), and returns the parsed struct. Returns `null` if the binding or struct is not found.

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `alignTo`
```ts
function alignTo(offset: number, alignment: number): number
```
Rounds `offset` up to the next multiple of `alignment`.

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `generateVariableDocumentation`
```ts
function generateVariableDocumentation(
    shaderType: 'compute' | 'vertex' | 'fragment' | 'background',
    renderType: 'canvas' | 'particle'
): string
```
Generates documentation comments listing available variables for a given shader stage and render type.

**Source:** `src/graphics/shaders/generate-variable-documentation.tsx`

---

#### `buildInitialShaders`
```ts
function buildInitialShaders(
    config: ShaderConfig,
    renderType: 'canvas' | 'particle'
): Record<tab_id, string>
```
Prepends auto-generated documentation comments to each shader stage from a `ShaderConfig`.

**Source:** `src/graphics/shaders/build-initial-shaders.tsx`

---

#### `extractFunctionBody`
```ts
function extractFunctionBody(userCode: string, functionName?: string): string
```
Extracts the body of a function (without the declaration and braces). Defaults to `'main'` if no name is given.

**Source:** `src/graphics/shaders/extract-function-body.tsx`

---

### Types and Interfaces

#### `ShaderConfig`
```ts
type ShaderConfig = {
    computeShader: string;
    vertexShader: string;
    fragmentShader: string;
    backgroundShader?: string;
}
```
Defines the source code for each shader stage in a template. The optional `backgroundShader` is a fragment shader rendered as a full-screen pass behind particle instances.

**Source:** `src/graphics/shaders/shader-config.tsx`

---

#### `StructField`
```ts
interface StructField {
    name: string;
    type: string;
    size: number;
    alignment: number;
    offset: number;
}
```
A single field in a parsed WGSL struct, with byte size, alignment, and offset.

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `StructInfo`
```ts
interface StructInfo {
    name: string;
    fields: StructField[];
    structText?: string;
    size: number;
    alignment: number;
}
```
A parsed WGSL struct with all its fields and total byte size/alignment.

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

#### `shader_diagnostic`
```ts
interface shader_diagnostic {
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}
```
A shader compilation diagnostic with position remapped to user code.

**Source:** `src/graphics/shaders/shader-validator.tsx`

---

### Shader Configs

Pre-built `ShaderConfig` constants, each loaded from `.wgsl` files in `src/shaders/`.

| Name | Description |
|---|---|
| `BlankShaderConfig` | Empty canvas vertex and fragment shaders |
| `RaymarchShaderConfig` | Canvas SDF ray marching fragment shader |
| `JuliaShaderConfig` | Canvas Julia set fractal fragment shader |
| `BlankParticleConfig` | Blank particle compute, vertex, and fragment shaders |
| `ParticleShaderConfig` | Rain simulation with mouse interaction |
| `GolShaderConfig` | Game of Life compute, vertex, and fragment shaders |

**Source:** `src/graphics/shaders/shader-builder.tsx`

---

## Renderers

### `IRenderer`
```ts
interface IRenderer {
    readonly device: GPUDevice | null;
    start(): Promise<void>;
    stop(): void;
    resize(width: number, height: number): void;
    recompileShaders(newShaderConfig: ShaderConfig, options?: any): Promise<void>;
    destroy(): void;
}
```
The renderer contract. All renderers implement this interface.

**Source:** `src/graphics/i-renderer.tsx`

---

### `BaseWebGPURenderer`
```ts
abstract class BaseWebGPURenderer implements IRenderer
```
Abstract base class implementing the template method pattern. Manages the lifecycle: `initialize()` > `animate()` > `update()` > `destroy()`. Owns `WebGPUContext`, `GPUResourceManager`, `AnimationController`, and `Time`.

**Source:** `src/graphics/renderers/base-web-gpu-renderer.tsx`

---

### `StrategyBasedRenderer`
```ts
class StrategyBasedRenderer extends BaseWebGPURenderer
```
Extends `BaseWebGPURenderer` by composing four strategy interfaces (`IPipelineStrategy`, `IResourceStrategy`, `IUpdateStrategy`, `IRenderStrategy`) instead of using inheritance for each variation.

**Source:** `src/graphics/renderers/strategy-based-renderer.tsx`

---

### `CanvasRenderer`
```ts
class CanvasRenderer extends StrategyBasedRenderer
```
Renders a full-screen triangle with vertex and fragment shaders. No compute stage. Uses `CanvasResourceStrategy`, `CanvasPipelineStrategy`, `CanvasRenderStrategy`, and `NullUpdateStrategy`.

**Source:** `src/graphics/renderers/canvas-renderer.tsx`

---

### `ParticleRenderer`
```ts
class ParticleRenderer extends StrategyBasedRenderer
```
Renders instanced particles with a compute shader for simulation. Uses `ParticleResourceStrategy`, `ParticlePipelineStrategy`, `ParticleComputeUpdateStrategy`, and `ParticleRenderStrategy`.

**Source:** `src/graphics/renderers/particle-renderer.tsx`

---

### Strategy Interfaces

#### `PipelineContext`
```ts
interface PipelineContext {
    format: GPUTextureFormat;
    renderBindGroupLayout: GPUBindGroupLayout;
    computeBindGroupLayout?: GPUBindGroupLayout;
}
```
Typed context passed from `IResourceStrategy.getPipelineContext()` to `IPipelineStrategy.createPipelines()`.

---

#### `IPipelineStrategy`
```ts
interface IPipelineStrategy {
    createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: PipelineContext
    ): Promise<{ compute?: GPUComputePipeline; render: GPURenderPipeline; background?: GPURenderPipeline }>;
}
```

---

#### `IResourceStrategy`
```ts
interface IResourceStrategy {
    initializeResources(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        config: { resolution: { width: number; height: number } }
    ): void;
    cleanup(): void;
    postUpdate(): void;
    getPipelineContext(format: GPUTextureFormat): PipelineContext;
    get BindGroups(): { compute?: GPUBindGroup[]; render: GPUBindGroup[]; background?: GPUBindGroup[] };
    get UniformBuffer(): UniformBuffer;
}
```
Owns all GPU resources (buffers, bind groups, layouts). `getPipelineContext()` provides the bind group layouts needed by `IPipelineStrategy`. `postUpdate()` runs after each compute dispatch (e.g., ping-pong buffer swap).

---

#### `IUpdateStrategy`
```ts
interface IUpdateStrategy {
    update(
        encoder: GPUCommandEncoder,
        pipeline: GPUComputePipeline,
        bindGroups: GPUBindGroup[]
    ): void;
}
```

---

#### `IRenderStrategy`
```ts
interface IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
        background?: { pipeline: GPURenderPipeline; bindGroup: GPUBindGroup }
    ): void;
}
```

The four strategy interfaces that `StrategyBasedRenderer` composes.

**Source:** `src/graphics/renderers/strategies/rendering-strategies.tsx`

---

## Pipelines

### `ComputePipelineBuilder`
```ts
class ComputePipelineBuilder
```
Fluent builder for `GPUComputePipeline`. Chain `.setLayout()`, `.setShaderModule()`, `.setEntryPoint()`, then call `.build()`.

**Source:** `src/graphics/pipelines/compute-pipeline-builder.tsx`

---

### `RenderPipelineBuilder`
```ts
class RenderPipelineBuilder
```
Fluent builder for `GPURenderPipeline`. Configure vertex/fragment shaders, layout, topology, and entry points, then call `.build()`.

**Source:** `src/graphics/pipelines/render-pipeline-builder.tsx`

---

### `UniformBuffer`
```ts
class UniformBuffer implements IBufferSystem {
    constructor(device: GPUDevice, resourceManager: GPUResourceManager);
    writeBuffer(data: Float32Array): void;
    get Buffer(): GPUBuffer;
}
```
Creates and manages a uniform buffer. Call `writeBuffer()` each frame to upload uniform data.

**Source:** `src/graphics/pipelines/input-output-buffers.tsx`

---

### `InputOutputBuffers`
```ts
class InputOutputBuffers implements IBufferSystem {
    constructor(device: GPUDevice, resourceManager: GPUResourceManager, config: ComputeConfig);
    writeBuffer(data: Float32Array): void;
    swap(): void;
    get InputBuffer(): GPUBuffer;
    get OutputBuffer(): GPUBuffer;
}
```
Double-buffered storage buffers for compute ping-pong. Call `swap()` after each compute dispatch to alternate input/output.

**Source:** `src/graphics/pipelines/input-output-buffers.tsx`

---

### `ComputeConfig`
```ts
interface ComputeConfig {
    particleCount: number;
    inOutBufferStruct: StructInfo | null;
    workgroupSize: [number, number, number];
    initialData: any[] | null;
}
```
Configuration for compute pipelines, including buffer struct layout, workgroup size, and optional initial data.

**Source:** `src/graphics/pipelines/compute-config.tsx`

---

## Buffer Writing

Helper functions for writing structured data into `ArrayBuffer`s. Used internally to populate GPU buffers from JSON or random data.

#### `getFieldComponents`
```ts
function getFieldComponents(type: string): { count: number; baseType: base_type }
```
Returns the number of scalar components and base type for a WGSL type. For example, `vec3<f32>` returns `{ count: 3, baseType: 'f32' }`.

---

#### `writeTypedValue`
```ts
function writeTypedValue(view: DataView, byteOffset: number, value: number, baseType: base_type): void
```
Writes a single scalar value to a `DataView` as `f32`, `u32`, or `i32` in little-endian byte order.

---

#### `resolveFieldValue`
```ts
function resolveFieldValue(fieldValue: any, componentIndex: number, componentCount: number): number
```
Extracts a single numeric component from a JSON field value. Returns `0` for null, missing, or invalid values.

---

#### `writeStructInstance`
```ts
function writeStructInstance(
    view: DataView,
    structOffset: number,
    fields: StructField[],
    getValue: value_source
): void
```
Writes a complete struct instance to a `DataView` at the given byte offset, using `getValue` to source each component value.

---

#### `randomValueForType`
```ts
function randomValueForType(baseType: base_type): number
```
Returns a random value appropriate for the given base type. `f32` returns a value in `[-1, 1)`, integer types return `0` or `1`.

---

#### `jsonValueSource`
```ts
function jsonValueSource(
    jsonData: any[],
    instanceIndex: number,
    isSingleField: boolean
): value_source
```
Creates a `value_source` callback that reads values from parsed JSON data for a given struct instance index.

---

#### `base_type`
```ts
type base_type = 'f32' | 'u32' | 'i32';
```

#### `value_source`
```ts
type value_source = (
    fieldIndex: number,
    componentIndex: number,
    count: number,
    baseType: base_type
) => number;
```

**Source:** `src/graphics/utils/buffer-writer.tsx`

---

## Utils

### `TypeInfo`
```ts
const TypeInfo: Record<string, { size: number; alignment: number }>
```
Maps WGSL type names (e.g., `'vec4f'`, `'mat4x4<f32>'`) to their byte size and alignment per the WebGPU spec.

**Source:** `src/graphics/utils/type-info.tsx`

---

#### `calculateWorkgroupCount`
```ts
function calculateWorkgroupCount(
    totalCount: number,
    workgroupSize: [number, number, number]
): [number, number, number]
```
Calculates the number of workgroups to dispatch for a given total element count and workgroup size.

**Source:** `src/graphics/utils/workgroup-utils.tsx`

---

#### `validateAndClampWorkgroupCount`
```ts
function validateAndClampWorkgroupCount(
    count: [number, number, number],
    workgroupSize: [number, number, number]
): [number, number, number]
```
Clamps workgroup counts to WebGPU device limits.

**Source:** `src/graphics/utils/workgroup-utils.tsx`

---

### `WebGPUContext`
```ts
class WebGPUContext {
    constructor(canvas: HTMLCanvasElement);
    async initialize(): Promise<void>;
    get Device(): GPUDevice;
    get Context(): GPUCanvasContext;
    get Format(): GPUTextureFormat;
    destroy(): void;
}
```
Manages WebGPU initialization: requests adapter/device, configures the canvas context, and exposes the preferred texture format. The canvas is passed to the constructor; `initialize()` performs the async GPU setup.

**Source:** `src/graphics/webgpu-context.tsx`

---

### `GPUResourceManager`
```ts
class GPUResourceManager {
    constructor(device: GPUDevice);
    createBuffer(size: number, usage: GPUBufferUsageFlags, label?: string): GPUBuffer;
    createShaderModule(code: string, label: string): GPUShaderModule;
    createBindGroup(layout: GPUBindGroupLayout, entries: GPUBindGroupEntry[], label?: string): GPUBindGroup;
}
```
Wraps `GPUDevice` to create GPU resources with a consistent API.

**Source:** `src/graphics/gpu-resource-manager.tsx`

---

### `AnimationController`
```ts
class AnimationController {
    start(callback: () => void): void;
    stop(): void;
    get IsRunning(): boolean;
}
```
Manages `requestAnimationFrame` lifecycle for the rendering loop.

**Source:** `src/graphics/animation-controller.tsx`

---

## Hooks

#### `useShaderCompilation`
```ts
function useShaderCompilation(
    shaderConfig: ShaderConfig,
    shaderType: 'canvas' | 'particle',
    renderSettings: render_settings,
    rendererRef: React.RefObject<IRenderer | null>
): {
    activeTab: tab_id;
    setActiveTab: (tab: tab_id) => void;
    userShaders: Record<tab_id, string>;
    fullVertexShader: { code: string; prefixLineCount: number; injections: ... };
    fullFragmentShader: { code: string; prefixLineCount: number; injections: ... };
    fullComputeShader: { code: string; prefixLineCount: number; injections: ... };
    fullBackgroundShader: { code: string; prefixLineCount: number; injections: ... };
    diagnostics: Record<tab_id, shader_diagnostic[]>;
    computeConfig: ComputeConfig | undefined;
    getTabs: () => Tab[];
    handleCompileAndApply: () => Promise<void>;
    handleEditorChange: (value: string) => void;
    handleDownloadShaders: () => Promise<void>;
    handleUploadShaders: (file: File) => Promise<void>;
}
```
Core React hook that manages the full shader editing workflow: tab state, live validation, compilation, hot-reloading, and zip import/export.

**Source:** `src/hooks/use-shader-compilation.tsx`

---

#### `useDarkMode`
```ts
function useDarkMode(): [boolean, (value: boolean) => void]
```
React hook for dark mode state, persisted to `localStorage`.

**Source:** `src/hooks/use-dark-mode.tsx`

---

## Types

#### `template_def`
```ts
type template_def = {
    name: string;
    description: string;
    shaderType: 'canvas' | 'particle';
    shaderConfig: ShaderConfig;
    defaultRenderSettings: render_settings;
}
```

#### `render_settings`
```ts
type render_settings = {
    vertexDrawCount: number;
    instanceCount: number;
    initialData: any[] | null;
}
```

#### `tab_id`
```ts
type tab_id = 'compute' | 'vertex' | 'fragment' | 'background';
```

#### `dark_mode_props`
```ts
type dark_mode_props = {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
}
```

**Source:** `src/types.tsx`

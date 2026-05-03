import type {UniformBuffer} from "@/graphics/pipelines/input-output-buffers.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";

/** The four strategy interfaces that StrategyBasedRenderer composes. Each renderer variant (canvas, particle) provides its own implementations. */

/** Typed context passed from IResourceStrategy to IPipelineStrategy so that pipeline creation has access to the bind group layouts allocated by the resource strategy. */
export interface PipelineContext {
    format: GPUTextureFormat;
    renderBindGroupLayout: GPUBindGroupLayout;
    computeBindGroupLayout?: GPUBindGroupLayout;
}

/** Builds GPU pipelines (compute and/or render) from shader code and bind group layouts. */
export interface IPipelineStrategy {
    createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: PipelineContext
    ): Promise<{ compute?: GPUComputePipeline; render: GPURenderPipeline; background?: GPURenderPipeline }>;
}

/** Owns all GPU resources (buffers, bind groups, layouts). Provides the uniform buffer, bind groups for each pass, and the pipeline context for pipeline creation. postUpdate() runs after each compute dispatch (e.g. ping-pong buffer swap). */
export interface IResourceStrategy {
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

/** Runs per-frame compute work. Canvas renderers use a no-op implementation. Particle renderers dispatch the compute shader and trigger buffer swaps. */
export interface IUpdateStrategy {
    update(
        encoder: GPUCommandEncoder,
        pipeline: GPUComputePipeline,
        bindGroups: GPUBindGroup[]
    ): void;
}

/** Issues the draw call(s) for a frame. Canvas renderers draw a full-screen triangle. Particle renderers optionally render a background pass first, then draw instanced quads. */
export interface IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
        background?: { pipeline: GPURenderPipeline; bindGroup: GPUBindGroup },
    ): void;
}

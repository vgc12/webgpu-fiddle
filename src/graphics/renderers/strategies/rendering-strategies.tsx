import type {UniformBuffer} from "@/graphics/pipelines/input-output-buffers.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";

export interface PipelineContext {
    format: GPUTextureFormat;
    renderBindGroupLayout: GPUBindGroupLayout;
    computeBindGroupLayout?: GPUBindGroupLayout;
}

export interface IPipelineStrategy {
    createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: PipelineContext
    ): Promise<{ compute?: GPUComputePipeline; render: GPURenderPipeline }>;
}

export interface IResourceStrategy {
    initializeResources(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        config: { resolution: { width: number; height: number } }
    ): void;

    cleanup(): void;

    postUpdate(): void;

    getPipelineContext(format: GPUTextureFormat): PipelineContext;

    get BindGroups(): { compute?: GPUBindGroup[]; render: GPUBindGroup[] };

    get UniformBuffer(): UniformBuffer;
}

export interface IUpdateStrategy {
    update(
        encoder: GPUCommandEncoder,
        pipeline: GPUComputePipeline,
        bindGroups: GPUBindGroup[]
    ): void;
}

export interface IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
    ): void;
}

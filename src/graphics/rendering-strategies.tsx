/**
 * Strategy interfaces for different aspects of rendering
 * These allow different renderers to compose their behavior from reusable strategies
 */

export interface IPipelineStrategy {
    createPipelines(
        device: GPUDevice,
        resourceManager: any,
        shaderConfig: any,
        context: any
    ): Promise<{ compute?: GPUComputePipeline; render: GPURenderPipeline }>;
}

export interface IResourceStrategy {
    initializeResources(
        device: GPUDevice,
        resourceManager: any,
        config: any
    ): void;

    cleanup(): void;

    getBindGroups(): { compute?: GPUBindGroup[]; render: GPUBindGroup[] };
}

export interface IUpdateStrategy {
    update(
        encoder: GPUCommandEncoder,
        resources: any,
        uniforms: any
    ): void;
}

export interface IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        config: any
    ): void;
}
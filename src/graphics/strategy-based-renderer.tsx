import type {shader_config} from "@/graphics/shader_config.tsx";
import type {IPipelineStrategy, IRenderStrategy, IResourceStrategy, IUpdateStrategy} from "./rendering-strategies";
import {BaseWebGPURenderer} from "@/graphics/base-web-gpu-renderer.tsx";


/**
 * Strategy-based renderer that composes different strategies
 * This allows for flexible renderer configurations by mixing and matching strategies
 */
export class StrategyBasedRenderer extends BaseWebGPURenderer {
    protected pipelines: { compute?: GPUComputePipeline; render: GPURenderPipeline };

    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: shader_config,
        protected pipelineStrategy: IPipelineStrategy,
        protected resourceStrategy: IResourceStrategy,
        protected updateStrategy: IUpdateStrategy,
        protected renderStrategy: IRenderStrategy,
        resolution?: { width: number; height: number }
    ) {
        super(canvas, shaderConfig, resolution);
    }

    async recompileShaders(newShaderConfig: shader_config, options?: any): Promise<void> {
        this.shaderConfig = newShaderConfig;

        // Allow strategies to be updated if provided in options
        if (options?.pipelineStrategy) {
            this.pipelineStrategy = options.pipelineStrategy;
        }
        if (options?.resourceStrategy) {
            this.resourceStrategy = options.resourceStrategy;
        }
        if (options?.updateStrategy) {
            this.updateStrategy = options.updateStrategy;
        }
        if (options?.renderStrategy) {
            this.renderStrategy = options.renderStrategy;
        }

        this.initializeResources();
        await this.createPipelines();
    }

    protected initializeResources(): void {
        this.resourceStrategy.initializeResources(
            this.gpuContext.Device,
            this.resourceManager,
            {resolution: this.resolution}
        );
    }

    protected async createPipelines(): Promise<void> {
        const context = this.getStrategyContext();
        this.pipelines = await this.pipelineStrategy.createPipelines(
            this.gpuContext.Device,
            this.resourceManager,
            this.shaderConfig,
            context
        );
    }

    protected cleanup(): void {
        this.resourceStrategy.cleanup();
    }

    protected update = (): void => {
        const context = this.gpuContext.Context;
        const device = this.gpuContext.Device;

        // Update uniforms
        this.updateUniforms();

        const currentTexture = context.getCurrentTexture();
        const textureView = currentTexture.createView();
        const encoder = device.createCommandEncoder();

        // Execute update strategy (e.g., compute pass)
        const bindGroups = this.resourceStrategy.getBindGroups();
        if (this.pipelines.compute && bindGroups.compute) {
            this.updateStrategy.update(encoder, this.pipelines.compute, bindGroups.compute);
        }

        // Execute render strategy
        this.renderStrategy.render(
            encoder,
            textureView,
            this.pipelines.render,
            bindGroups.render[0],
            {}
        );

        device.queue.submit([encoder.finish()]);
    };

    /**
     * Hook for updating uniforms - can be overridden by subclasses
     */
    protected updateUniforms(): void {
        // Default implementation - override in subclasses if needed
    }

    /**
     * Provides context for strategy initialization
     * Override this method to provide strategy-specific context
     */
    protected getStrategyContext(): any {
        return {
            format: this.gpuContext.Format
        };
    }
}
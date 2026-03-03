import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import type {IPipelineStrategy, IRenderStrategy, IResourceStrategy, IUpdateStrategy} from "./rendering-strategies";
import {BaseWebGPURenderer} from "@/graphics/base-web-gpu-renderer.tsx";
import type {render_settings} from "@/components/app.tsx";


/**
 * Strategy-based renderer that composes different strategies
 * This allows for flexible renderer configurations by mixing and matching strategies
 */
export class StrategyBasedRenderer extends BaseWebGPURenderer {
    protected pipelines: { compute?: GPUComputePipeline; render: GPURenderPipeline };
    protected mousePosition = { x: 1, y: 1 };
    
    handleMouseMove = (e: { clientX: number; clientY: number; }) => {
       
        if (!this.canvas) {
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.mousePosition = { x, y };
        
    };


    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: ShaderConfig,
        protected pipelineStrategy: IPipelineStrategy,
        protected resourceStrategy: IResourceStrategy,
        protected updateStrategy: IUpdateStrategy,
        protected renderStrategy: IRenderStrategy,
        protected renderSettings: render_settings,
        resolution?: { width: number; height: number }
    ) {
        super(canvas, shaderConfig, resolution);
        canvas.addEventListener('mousemove', this.handleMouseMove);
    }


    async recompileShaders(newShaderConfig: ShaderConfig): Promise<void> {
        this.shaderConfig = newShaderConfig;
        this.initializeResources();
        await this.createPipelines();
        this.time.reset();
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
        const bindGroups = this.resourceStrategy.BindGroups;
        if (this.pipelines.compute && bindGroups.compute) {
            this.updateStrategy.update(encoder, this.pipelines.compute, bindGroups.compute);
        }

        // Execute render strategy
        this.renderStrategy.render(
            encoder,
            textureView,
            this.pipelines.render,
            bindGroups.render[0],
            this.renderSettings.vertexDrawCount,
            this.renderSettings.instanceCount,
            {}
        );

        device.queue.submit([encoder.finish()]);
    };


    /**
     * Hook for updating uniforms - can be overridden by subclasses
     */
    protected updateUniforms(): void {
        const uniformData = new Float32Array([
            this.resolution.width,
            this.resolution.height,
            this.mousePosition.x,
            this.mousePosition.y,
            this.resolution.width / this.resolution.height,
            this.time.TotalTime
        ]);

        this.resourceStrategy.UniformBuffer.writeBuffer(uniformData);
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
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import type {IPipelineStrategy, IRenderStrategy, IResourceStrategy, IUpdateStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import {BaseWebGPURenderer} from "@/graphics/renderers/base-web-gpu-renderer.tsx";
import type {render_settings} from "@/types.tsx";

// Extends the base renderer by delegating to four strategy interfaces instead of
// using inheritance for each renderer variant. Each frame: write uniforms, run
// compute (if present), render background (if present), draw main geometry, submit.
export class StrategyBasedRenderer extends BaseWebGPURenderer {
    protected pipelines: { compute?: GPUComputePipeline; render: GPURenderPipeline; background?: GPURenderPipeline };
    protected mousePosition = {x: 1, y: 1};

    // Track mouse position in physical pixels for the mousePosition uniform.
    handleMouseMove = (e: { clientX: number; clientY: number; }) => {
        if (!this.canvas) {
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = (e.clientX - rect.left) * dpr;
        const y = (e.clientY - rect.top) * dpr;
        this.mousePosition = {x, y};
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
        const context = this.resourceStrategy.getPipelineContext(this.gpuContext.Format);
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

    // Per-frame callback: upload uniforms, dispatch compute, render, submit.
    protected update = (): void => {
        const context = this.gpuContext.Context;
        const device = this.gpuContext.Device;

        this.updateUniforms();

        const currentTexture = context.getCurrentTexture();
        const textureView = currentTexture.createView();
        const encoder = device.createCommandEncoder();

        const bindGroups = this.resourceStrategy.BindGroups;
        if (this.pipelines.compute && bindGroups.compute) {
            this.updateStrategy.update(encoder, this.pipelines.compute, bindGroups.compute);
        }

        const bgInfo = this.pipelines.background && bindGroups.background
            ? { pipeline: this.pipelines.background, bindGroup: bindGroups.background[0] }
            : undefined;

        this.renderStrategy.render(
            encoder,
            textureView,
            this.pipelines.render,
            bindGroups.render[0],
            this.renderSettings.vertexDrawCount,
            this.renderSettings.instanceCount,
            bgInfo,
        );

        device.queue.submit([encoder.finish()]);
    };

    // Pack resolution, mouse, aspect ratio, time, and deltaTime into a Float32Array
    // and upload to the GPU uniform buffer each frame.
    private updateUniforms(): void {
        const uniformData = new Float32Array([
            this.resolution.width,
            this.resolution.height,
            this.mousePosition.x,
            this.mousePosition.y,
            this.resolution.width / this.resolution.height,
            this.time.TotalTime,
            this.time.DeltaTime,
            0, // padding to 32 bytes (struct alignment)
        ]);

        this.resourceStrategy.UniformBuffer.writeBuffer(uniformData);
    }
}

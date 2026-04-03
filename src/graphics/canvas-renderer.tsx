// Draws a rectangle that covers the whole screen
import {StrategyBasedRenderer} from "@/graphics/strategy-based-renderer.tsx";
import {NullUpdateStrategy} from "@/graphics/particle-strategies.tsx";
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import {CanvasPipelineStrategy, CanvasRenderStrategy, CanvasResourceStrategy} from "@/graphics/canvas-strategies.tsx";
import type {render_settings} from "@/components/app.tsx";

export class CanvasRenderer extends StrategyBasedRenderer {
    private canvasResourceStrategy: CanvasResourceStrategy;


    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: ShaderConfig,
        renderSettings: render_settings,
        resolution?: { width: number; height: number }
    ) {
        const resourceStrategy = new CanvasResourceStrategy();
        const pipelineStrategy = new CanvasPipelineStrategy();
        const updateStrategy = new NullUpdateStrategy();
        const renderStrategy = new CanvasRenderStrategy();

        super(
            canvas,
            shaderConfig,
            pipelineStrategy,
            resourceStrategy,
            updateStrategy,
            renderStrategy,
            renderSettings,
            resolution
        );

        this.canvasResourceStrategy = resourceStrategy;
    }

    async recompileShaders(
        newShaderConfig: ShaderConfig,
    ): Promise<void> {
        
        // Recreate strategies with new config
        this.canvasResourceStrategy = new CanvasResourceStrategy();
        this.resourceStrategy = this.canvasResourceStrategy;

        this.renderStrategy = new CanvasRenderStrategy();


        await super.recompileShaders(newShaderConfig);
    }

    protected updateUniforms(): void {
        const uniformData = new Float32Array([
            this.resolution.width,
            this.resolution.height,
            this.mousePosition.x,
            this.mousePosition.y,
            this.resolution.width / this.resolution.height,
            this.time.TotalTime
        ]);
        //console.log(uniformData);
        this.canvasResourceStrategy.UniformBuffer.writeBuffer(uniformData);
    }

    protected getStrategyContext(): any {
        return {
            format: this.gpuContext.Format,
            renderBindGroupLayout: this.canvasResourceStrategy.getRenderBindGroupLayout()
        };
    }
}
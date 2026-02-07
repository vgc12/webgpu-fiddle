import {StrategyBasedRenderer} from "./strategy-based-renderer";
import {
    CanvasPipelineStrategy, CanvasRenderStrategy,
    CanvasResourceStrategy, NullUpdateStrategy,
    ParticleComputeUpdateStrategy,
    ParticlePipelineStrategy,
    ParticleRenderStrategy,
    ParticleResourceStrategy
} from "@/graphics/particle-strategies.tsx";
import type {shader_config} from "@/graphics/shader_config.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";

/**
 * Particle Renderer draws multiple particles at once 
 */
export class ParticleRenderer extends StrategyBasedRenderer {
    private particleResourceStrategy: ParticleResourceStrategy;

    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: shader_config,
        private computeConfig: ComputeConfig = {
            count: 1000,
            inOutBufferStruct: null,
            workgroupSize: [64, 1, 1]
        },
        resolution?: { width: number; height: number }
    ) {
        // Create particle-specific strategies
        const resourceStrategy = new ParticleResourceStrategy(computeConfig);
        const pipelineStrategy = new ParticlePipelineStrategy();
        const updateStrategy = new ParticleComputeUpdateStrategy(computeConfig, resourceStrategy);
        const renderStrategy = new ParticleRenderStrategy(computeConfig.count);

        super(
            canvas,
            shaderConfig,
            pipelineStrategy,
            resourceStrategy,
            updateStrategy,
            renderStrategy,
            resolution
        );

        this.particleResourceStrategy = resourceStrategy;
    }

    async recompileShaders(
        newShaderConfig: shader_config,
        options?: { computeConfig?: Partial<ComputeConfig> }
    ): Promise<void> {
        // Update compute config if provided
        if (options?.computeConfig) {
            this.computeConfig = {...this.computeConfig, ...options.computeConfig};

            // Recreate strategies with new config
            this.particleResourceStrategy = new ParticleResourceStrategy(this.computeConfig);
            this.resourceStrategy = this.particleResourceStrategy;
            this.updateStrategy = new ParticleComputeUpdateStrategy(
                this.computeConfig,
                this.particleResourceStrategy
            );
            this.renderStrategy = new ParticleRenderStrategy(this.computeConfig.count);
        }

        await super.recompileShaders(newShaderConfig, options);
    }

    protected updateUniforms(): void {
        const uniformData = new Float32Array([
            this.resolution.width,
            this.resolution.height,
            this.resolution.width / this.resolution.height,
            this.time.TotalTime
        ]);

        this.particleResourceStrategy.getUniformBuffer().writeBuffer(uniformData);
    }

    protected getStrategyContext(): any {
        return {
            format: this.gpuContext.Format,
            computeBindGroupLayout: this.particleResourceStrategy.getComputeBindGroupLayout(),
            renderBindGroupLayout: this.particleResourceStrategy.getRenderBindGroupLayout()
        };
    }
}

// Draws a rectangle that covers the whole screen
export class CanvasRenderer extends StrategyBasedRenderer{
    private canvasResourceStrategy: CanvasResourceStrategy;

    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: shader_config,
        resolution?: { width: number; height: number }
    ) {
        // Create particle-specific strategies
        const resourceStrategy = new CanvasResourceStrategy()
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
            resolution
        );


    }

    async recompileShaders(
        newShaderConfig: shader_config,
        options?: { computeConfig?: Partial<ComputeConfig> }
    ): Promise<void> {
        // Update compute config if provided
        if (options?.computeConfig) {
       

            // Recreate strategies with new config
            this.canvasResourceStrategy = new CanvasResourceStrategy();
            this.resourceStrategy = this.canvasResourceStrategy;
    
            this.renderStrategy = new CanvasRenderStrategy();
        }

        await super.recompileShaders(newShaderConfig, options);
    }

    protected updateUniforms(): void {
        const uniformData = new Float32Array([
            this.resolution.width,
            this.resolution.height,
            this.resolution.width / this.resolution.height,
            this.time.TotalTime
        ]);

        this.canvasResourceStrategy.getUniformBuffer().writeBuffer(uniformData);
    }

    protected getStrategyContext(): any {
        return {
            format: this.gpuContext.Format,
            renderBindGroupLayout: this.canvasResourceStrategy.getRenderBindGroupLayout()
        };
    }
}
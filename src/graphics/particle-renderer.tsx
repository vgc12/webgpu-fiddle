import {StrategyBasedRenderer} from "./strategy-based-renderer";
import {
    ParticleComputeUpdateStrategy,
    ParticlePipelineStrategy,
    ParticleRenderStrategy,
    ParticleResourceStrategy
} from "@/graphics/particle-strategies.tsx";
import type {ShaderConfig} from "@/graphics/shader_config.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";

/**
 * Particle Renderer draws multiple particles at once
 */
export class ParticleRenderer extends StrategyBasedRenderer {
    private particleResourceStrategy: ParticleResourceStrategy;

    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: ShaderConfig,
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
        newShaderConfig: ShaderConfig,
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

        await super.recompileShaders(newShaderConfig);
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


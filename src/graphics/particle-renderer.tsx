import {StrategyBasedRenderer} from "./strategy-based-renderer";
import {
    ParticleComputeUpdateStrategy,
    ParticlePipelineStrategy,
    ParticleRenderStrategy,
    ParticleResourceStrategy
} from "@/graphics/particle-strategies.tsx";
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";
import type {render_settings} from "@/components/app.tsx";

/**
 * Particle Renderer draws multiple particles at once
 */
export class ParticleRenderer extends StrategyBasedRenderer {
    private particleResourceStrategy: ParticleResourceStrategy;

    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: ShaderConfig,
        renderSettings : render_settings,
        private computeConfig: ComputeConfig = {
            particleCount : 2000,
            inOutBufferStruct: null,
            workgroupSize: [64, 1, 1]
        },
        resolution?: { width: number; height: number }
    ) {
        // Create particle-specific strategies
        const resourceStrategy = new ParticleResourceStrategy(computeConfig, renderSettings.instanceCount);
        const pipelineStrategy = new ParticlePipelineStrategy();
        const updateStrategy = new ParticleComputeUpdateStrategy(computeConfig, resourceStrategy, renderSettings.instanceCount);
        const renderStrategy = new ParticleRenderStrategy();

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

        this.particleResourceStrategy = resourceStrategy;
    }

    async recompileShaders(
        newShaderConfig: ShaderConfig,
        options?: { computeConfig?: Partial<ComputeConfig>, renderSettings?: Partial<render_settings> }
    ): Promise<void> {
        // Update compute config if provided
        if (options?.computeConfig) {
            this.computeConfig = {...this.computeConfig, ...options.computeConfig};

            // Recreate strategies with new config
            this.particleResourceStrategy = new ParticleResourceStrategy(this.computeConfig, this.renderSettings.instanceCount);
            this.resourceStrategy = this.particleResourceStrategy;
            this.updateStrategy = new ParticleComputeUpdateStrategy(
                this.computeConfig,
                this.particleResourceStrategy,
                this.renderSettings.instanceCount
            );
            this.renderStrategy = new ParticleRenderStrategy();
        }

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

        this.particleResourceStrategy.UniformBuffer.writeBuffer(uniformData);
    }

    protected getStrategyContext(): any {
        return {
            format: this.gpuContext.Format,
            computeBindGroupLayout: this.particleResourceStrategy.getComputeBindGroupLayout(),
            renderBindGroupLayout: this.particleResourceStrategy.getRenderBindGroupLayout()
        };
    }
}


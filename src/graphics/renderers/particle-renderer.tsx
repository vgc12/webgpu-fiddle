import {StrategyBasedRenderer} from "@/graphics/renderers/strategy-based-renderer.tsx";
import {ParticleComputeUpdateStrategy} from "@/graphics/renderers/strategies/particle-update-strategy.tsx";
import {ParticleRenderStrategy} from "@/graphics/renderers/strategies/particle-render-strategy.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";
import type {render_settings} from "@/types.tsx";
import {ParticlePipelineStrategy} from "@/graphics/renderers/strategies/particle-pipeline-strategy.tsx";
import {ParticleResourceStrategy} from "@/graphics/renderers/strategies/particle-resource-strategy.tsx";

/** Renders instanced particles driven by a compute shader each frame.
 Plugs in particle-specific strategies: ping-pong storage buffers, compute +
 render pipelines, compute dispatch with buffer swap, and instanced drawing
 with an optional background pass.
*/
export class ParticleRenderer extends StrategyBasedRenderer {
    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: ShaderConfig,
        renderSettings: render_settings,
        private computeConfig: ComputeConfig = {
            particleCount: 2000,
            inOutBufferStruct: null,
            workgroupSize: [64, 1, 1],
            initialData: null
        },
        resolution?: { width: number; height: number }
    ) {
        const resourceStrategy = new ParticleResourceStrategy(computeConfig, renderSettings.instanceCount);

        super(
            canvas,
            shaderConfig,
            new ParticlePipelineStrategy(),
            resourceStrategy,
            new ParticleComputeUpdateStrategy(computeConfig, resourceStrategy, renderSettings.instanceCount),
            new ParticleRenderStrategy(),
            renderSettings,
            resolution
        );
    }

    async recompileShaders(
        newShaderConfig: ShaderConfig,
        options?: { computeConfig?: Partial<ComputeConfig>, renderSettings?: Partial<render_settings> }
    ): Promise<void> {
        const newConfig = options?.computeConfig;

        // Only recreate GPU buffers if the struct layout, particle count, or initial
        // data changed. Otherwise, just rebuild pipelines to preserve particle state.
        const needsNewBuffers = newConfig && (
            newConfig.particleCount !== this.computeConfig.particleCount ||
            newConfig.inOutBufferStruct?.size !== this.computeConfig.inOutBufferStruct?.size ||
            newConfig.initialData !== undefined
        );

        if (needsNewBuffers) {
            this.computeConfig = {...this.computeConfig, ...newConfig};

            const resourceStrategy = new ParticleResourceStrategy(this.computeConfig, this.renderSettings.instanceCount);
            this.resourceStrategy = resourceStrategy;
            this.updateStrategy = new ParticleComputeUpdateStrategy(
                this.computeConfig,
                resourceStrategy,
                this.renderSettings.instanceCount
            );
            this.renderStrategy = new ParticleRenderStrategy();
            this.initializeResources();
        }

        await super.recompileShaders(newShaderConfig);
    }
}

import {StrategyBasedRenderer} from "@/graphics/renderers/strategy-based-renderer.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {CanvasResourceStrategy} from "@/graphics/renderers/strategies/canvas-resource-strategy.tsx";
import type {render_settings} from "@/types.tsx";
import {NullUpdateStrategy} from "@/graphics/renderers/strategies/null-update-strategy.tsx";
import {CanvasPipelineStrategy} from "@/graphics/renderers/strategies/canvas-pipeline-strategy.tsx";
import {CanvasRenderStrategy} from "@/graphics/renderers/strategies/canvas-render-strategy.tsx";

export class CanvasRenderer extends StrategyBasedRenderer {
    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: ShaderConfig,
        renderSettings: render_settings,
        resolution?: { width: number; height: number }
    ) {
        super(
            canvas,
            shaderConfig,
            new CanvasPipelineStrategy(),
            new CanvasResourceStrategy(),
            new NullUpdateStrategy(),
            new CanvasRenderStrategy(),
            renderSettings,
            resolution
        );
    }

    async recompileShaders(newShaderConfig: ShaderConfig): Promise<void> {
        await super.recompileShaders(newShaderConfig);
    }
}

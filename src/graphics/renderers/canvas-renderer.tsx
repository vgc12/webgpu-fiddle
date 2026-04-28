import {StrategyBasedRenderer} from "@/graphics/renderers/strategy-based-renderer.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {CanvasResourceStrategy} from "@/graphics/renderers/strategies/canvas-resource-strategy.tsx";
import type {render_settings} from "@/types.tsx";
import {NullUpdateStrategy} from "@/graphics/renderers/strategies/null-update-strategy.tsx";
import {CanvasPipelineStrategy} from "@/graphics/renderers/strategies/canvas-pipeline-strategy.tsx";
import {CanvasRenderStrategy} from "@/graphics/renderers/strategies/canvas-render-strategy.tsx";

// Renders a full-screen triangle with vertex + fragment shaders only (no compute).
// Plugs in canvas-specific strategies: uniform-only resources, a simple render
// pipeline, a single draw call, and a no-op update step.
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

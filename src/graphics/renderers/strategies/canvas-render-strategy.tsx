import type {IRenderStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";

/** Render strategy for canvas renderers. Begins a render pass that clears to black, sets the pipeline and bind group, draws the specified vertex/instance count, and ends. */
export class CanvasRenderStrategy implements IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
    ): void {
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.draw(drawCount, instanceCount);
        renderPass.end();
    }
}
import type {IRenderStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";

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
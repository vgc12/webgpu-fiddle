import type {IRenderStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";

// Render strategy for particle renderers. Optionally renders a background pass
// (full-screen triangle, clears to black), then draws instanced particle geometry
// on top using loadOp 'load' to preserve the background.
export class ParticleRenderStrategy implements IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
        background?: { pipeline: GPURenderPipeline; bindGroup: GPUBindGroup },
    ): void {
        // Pass 1: background (full-screen triangle, clears the screen)
        if (background) {
            const bgPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: textureView,
                    clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                    loadOp: 'clear',
                    storeOp: 'store'
                }]
            });
            bgPass.setPipeline(background.pipeline);
            bgPass.setBindGroup(0, background.bindGroup);
            bgPass.draw(3);
            bgPass.end();
        }

        // Pass 2: particles (drawn on top of the background)
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: background ? 'load' : 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.draw(drawCount, instanceCount);
        renderPass.end();
    }
}

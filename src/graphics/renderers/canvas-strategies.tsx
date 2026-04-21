import type {IPipelineStrategy, IRenderStrategy, IResourceStrategy} from "@/graphics/renderers/rendering-strategies.tsx";
import {UniformBuffer} from "@/graphics/pipelines/input-output-buffers.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import {createCanvasRenderBindGroup, createCanvasRenderLayout} from "@/graphics/renderers/canvas-bind-group-functions.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {RenderPipelineBuilder} from "@/graphics/pipelines/render-pipeline-builder.tsx";

export class CanvasResourceStrategy implements IResourceStrategy {
    private uniformBuffer: UniformBuffer;
    private renderBindGroup: GPUBindGroup;
    private renderLayout: GPUBindGroupLayout;

    cleanup(): void {
        // noop
    }


    initializeResources(device: GPUDevice, resourceManager: GPUResourceManager, _config: {
        resolution: { width: number; height: number }
    }): void {


        this.renderLayout = createCanvasRenderLayout(device);

        this.uniformBuffer = new UniformBuffer(device, resourceManager);


        this.renderLayout = createCanvasRenderLayout(device);
        this.renderBindGroup = createCanvasRenderBindGroup({
                device: device,
                uniformBuffer: this.uniformBuffer
            }, createCanvasRenderLayout(device)
        );

    }


    get BindGroups(): { compute: GPUBindGroup[], render: GPUBindGroup[] } {
        return {
            compute: [],
            render: [this.renderBindGroup]
        };
    }

    get UniformBuffer(): UniformBuffer {
        return this.uniformBuffer;
    }

    getRenderBindGroupLayout(): GPUBindGroupLayout {
        return this.renderLayout;
    }

}

export class CanvasRenderStrategy implements IRenderStrategy {
    constructor() {
    }

    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
        _config?: never
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

export class CanvasPipelineStrategy implements IPipelineStrategy {
    async createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: {
            format: GPUTextureFormat;
            renderBindGroupLayout: GPUBindGroupLayout
        }
    ): Promise<{ render: GPURenderPipeline }> {
        // Create shader modules


        const vertexShaderModule = resourceManager.createShaderModule(
            shaderConfig.vertexShader,
            'Particle Vertex Shader'
        );

        const fragmentShaderModule = resourceManager.createShaderModule(
            shaderConfig.fragmentShader,
            'Particle Fragment Shader'
        );


        const renderPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [context.renderBindGroupLayout]
        });


        const render = await new RenderPipelineBuilder(device, context.format)
            .setVertexShaderModule(vertexShaderModule)
            .setFragmentShaderModule(fragmentShaderModule)
            .setLayout(renderPipelineLayout)
            .setVertexEntryPoint('vertexMain')
            .setFragmentEntryPoint('fragmentMain')
            .setTopology('triangle-list')
            .buildAsync();

        return {render: render}
    }
}
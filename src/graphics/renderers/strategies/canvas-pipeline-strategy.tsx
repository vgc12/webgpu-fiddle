import type {IPipelineStrategy, PipelineContext} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {RenderPipelineBuilder} from "@/graphics/pipelines/render-pipeline-builder.tsx";

// Pipeline strategy for canvas renderers. Compiles vertex + fragment shader modules
// and builds a single render pipeline with triangle-list topology.
export class CanvasPipelineStrategy implements IPipelineStrategy {
    async createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: PipelineContext
    ): Promise<{ render: GPURenderPipeline }> {
        const vertexShaderModule = resourceManager.createShaderModule(
            shaderConfig.vertexShader,
            'Canvas Vertex Shader'
        );
        const fragmentShaderModule = resourceManager.createShaderModule(
            shaderConfig.fragmentShader,
            'Canvas Fragment Shader'
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

        return {render};
    }
}

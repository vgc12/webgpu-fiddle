import type {IPipelineStrategy, PipelineContext} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {ComputePipelineBuilder} from "@/graphics/pipelines/compute-pipeline-builder.tsx";
import {RenderPipelineBuilder} from "@/graphics/pipelines/render-pipeline-builder.tsx";

export class ParticlePipelineStrategy implements IPipelineStrategy {
    async createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: PipelineContext
    ): Promise<{ compute: GPUComputePipeline; render: GPURenderPipeline }> {
        const computeShaderModule = resourceManager.createShaderModule(
            shaderConfig.computeShader,
            'Particle Update Shader'
        );
        const vertexShaderModule = resourceManager.createShaderModule(
            shaderConfig.vertexShader,
            'Particle Vertex Shader'
        );
        const fragmentShaderModule = resourceManager.createShaderModule(
            shaderConfig.fragmentShader,
            'Particle Fragment Shader'
        );

        const computePipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [context.computeBindGroupLayout!]
        });
        const renderPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [context.renderBindGroupLayout]
        });

        const compute = await new ComputePipelineBuilder(device)
            .setShaderModule(computeShaderModule)
            .setLayout(computePipelineLayout)
            .setEntryPoint('computeMain')
            .buildAsync();

        const render = await new RenderPipelineBuilder(device, context.format)
            .setVertexShaderModule(vertexShaderModule)
            .setFragmentShaderModule(fragmentShaderModule)
            .setLayout(renderPipelineLayout)
            .setVertexEntryPoint('vertexMain')
            .setFragmentEntryPoint('fragmentMain')
            .setTopology('triangle-list')
            .buildAsync();

        return {compute, render};
    }
}

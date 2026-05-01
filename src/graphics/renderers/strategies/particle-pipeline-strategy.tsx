import type {IPipelineStrategy, PipelineContext} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {ComputePipelineBuilder} from "@/graphics/pipelines/compute-pipeline-builder.tsx";
import {RenderPipelineBuilder} from "@/graphics/pipelines/render-pipeline-builder.tsx";
import canvasVertexShader from '@/shaders/canvas/blank/vertex.wgsl';
import {injectUniformsIntoShader} from "@/graphics/shaders/shader-builder.tsx";

// Pipeline strategy for particle renderers. Builds a compute pipeline, a render
// pipeline for instanced particle drawing, and optionally a background render
// pipeline (full-screen triangle pass using the canvas vertex shader).
export class ParticlePipelineStrategy implements IPipelineStrategy {
    async createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: PipelineContext
    ): Promise<{ compute: GPUComputePipeline; render: GPURenderPipeline; background?: GPURenderPipeline }> {
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

        // Build background pipeline if a background shader is provided
        let background: GPURenderPipeline | undefined;
        if (shaderConfig.backgroundShader) {
            const bgVertexModule = resourceManager.createShaderModule(
                injectUniformsIntoShader(canvasVertexShader).code,
                'Background Vertex Shader'
            );
            const bgFragmentModule = resourceManager.createShaderModule(
                shaderConfig.backgroundShader,
                'Background Fragment Shader'
            );

            // Background pass uses the canvas bind group layout (uniform-only)
            const bgLayout = device.createBindGroupLayout({
                label: 'Background Render Layout',
                entries: [{
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {type: 'uniform'}
                }]
            });
            const bgPipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [bgLayout]
            });

            background = await new RenderPipelineBuilder(device, context.format)
                .setVertexShaderModule(bgVertexModule)
                .setFragmentShaderModule(bgFragmentModule)
                .setLayout(bgPipelineLayout)
                .setVertexEntryPoint('vertexMain')
                .setFragmentEntryPoint('fragmentMain')
                .setTopology('triangle-list')
                .buildAsync();
        }

        return {compute, render, background};
    }
}

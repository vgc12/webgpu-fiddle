import {ComputePipelineBuilder} from "@/graphics/compute-pipeline-builder.tsx";
import {RenderPipelineBuilder} from "@/graphics/render-pipeline-builder.tsx";
import type {IFactory} from "@/graphics/i-factory.tsx";

// Move abstract class BEFORE implementations
export abstract class RenderPipelineFactory implements IFactory<GPURenderPipeline> {
    protected constructor(
        protected device: GPUDevice,
    ) {
    }

    abstract create(): GPURenderPipeline;

    abstract createAsync(): Promise<GPURenderPipeline>;
}

export abstract class ComputePipelineFactory implements IFactory<GPUComputePipeline> {
    protected constructor(
        protected device: GPUDevice,
    ) {
    }

    abstract create(): GPUComputePipeline;

    abstract createAsync(): Promise<GPUComputePipeline>;
}

export class ParticleRenderPipelineFactory extends RenderPipelineFactory {
    constructor(device: GPUDevice, private format: GPUTextureFormat,
                private vertexShader: GPUShaderModule,
                private fragmentShader: GPUShaderModule,
                private pipelineLayout?: GPUPipelineLayout) {
        super(device); // Call parent constructor with device
    }

    createRenderPipelineBuilder(): RenderPipelineBuilder {
        return new RenderPipelineBuilder(this.device, this.format);
    }

    public create(): GPURenderPipeline {
        return this.createRenderPipelineBuilder()
                   .setVertexShaderModule(this.vertexShader)
                   .setFragmentShaderModule(this.fragmentShader)
                   .setLayout(this.pipelineLayout || 'auto')
                   .setVertexEntryPoint('vertexMain')
                   .setFragmentEntryPoint('fragmentMain')
                   .setTopology('triangle-list')
                   .build();
    }

    // Implement abstract method
    createAsync(): Promise<GPURenderPipeline> {
        return this.createRenderPipelineBuilder()
                   .setVertexShaderModule(this.vertexShader)
                   .setFragmentShaderModule(this.fragmentShader)
                   .setLayout(this.pipelineLayout || 'auto')
                   .setVertexEntryPoint('vertexMain')
                   .setFragmentEntryPoint('fragmentMain')
                   .setTopology('triangle-list')
                   .buildAsync();
    }
}

export class ComputeParticlePipelineFactory extends ComputePipelineFactory {
    constructor(device: GPUDevice, private shaderModule: GPUShaderModule, private pipelineLayout?: GPUPipelineLayout) {
        super(device); // Call parent constructor, no extra params
    }

    createComputePipelineBuilder(): ComputePipelineBuilder {
        return new ComputePipelineBuilder(this.device);
    }

    public create(): GPUComputePipeline {
        return this.createComputePipelineBuilder()
                   .setShaderModule(this.shaderModule)
                   .setLayout(this.pipelineLayout || 'auto')
                   .setEntryPoint('computeMain')
                   .build();
    }

    createAsync(): Promise<GPUComputePipeline> {
        return this.createComputePipelineBuilder()
                   .setShaderModule(this.shaderModule)
                   .setLayout(this.pipelineLayout || 'auto')
                   .setEntryPoint('computeMain')
                   .buildAsync();
    }
}
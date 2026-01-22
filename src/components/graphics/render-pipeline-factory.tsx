import {ComputePipelineBuilder} from "@/components/graphics/compute-pipeline-builder.tsx";
import {RenderPipelineBuilder} from "@/components/graphics/render-pipeline-builder.tsx";
import type {IFactory} from "@/components/graphics/i-factory.tsx";

// Move abstract class BEFORE implementations
export abstract class RenderPipelineFactory implements IFactory<GPURenderPipeline> {
    protected constructor(
        protected device: GPUDevice,
    ) {}

    abstract create(): GPURenderPipeline;
}

export abstract class ComputePipelineFactory implements IFactory<GPUComputePipeline>{
    protected constructor(
        protected device: GPUDevice,
    ) {}

    abstract create(): GPUComputePipeline;
}

export class ParticleRenderPipelineFactory extends RenderPipelineFactory {
    constructor(device: GPUDevice, private format: GPUTextureFormat, private shader: GPUShaderModule) {
        super(device); // Call parent constructor with device
    }

    createRenderPipelineBuilder(): RenderPipelineBuilder {
        return new RenderPipelineBuilder(this.device, this.format);
    }

    

    // Implement abstract method
    create(): GPURenderPipeline {
        return this.createRenderPipelineBuilder()
            .setShaderModule(this.shader)
            .setVertexEntryPoint('vertexMain')
            .setFragmentEntryPoint('fragmentMain')
            .addVertexBuffer({
                arrayStride: 16,
                stepMode: 'instance',
                attributes: [
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2'
                    },
                    {
                        shaderLocation: 1,
                        offset: 8,
                        format: 'float32x2'
                    }
                ]
            })
            .setTopology('triangle-list')
            .build();
    }
}

export class ComputeParticlePipelineFactory extends ComputePipelineFactory {
    constructor( device: GPUDevice, private shaderModule: GPUShaderModule,) {
        super(device); // Call parent constructor, no extra params
    }

    createComputePipelineBuilder(): ComputePipelineBuilder {
        return new ComputePipelineBuilder(this.device);
    }
    
    public create(): GPUComputePipeline{
        return this.createComputePipelineBuilder()
            .setShaderModule(this.shaderModule)
            .setEntryPoint('main')
            .build();
    }
}
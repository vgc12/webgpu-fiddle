// Fluent builder for GPUComputePipeline.
// Chain setLayout(), setShaderModule(), setEntryPoint(), then call build() or buildAsync().
export class ComputePipelineBuilder {
    private layout: GPUPipelineLayout | 'auto' = 'auto';
    private shaderModule: GPUShaderModule | null = null;
    private entryPoint: string = 'main';

    constructor(private device: GPUDevice) {
    }

    setLayout(layout: GPUPipelineLayout | 'auto'): this {
        this.layout = layout;
        return this;
    }

    setShaderModule(module: GPUShaderModule): this {
        this.shaderModule = module;
        return this;
    }

    setEntryPoint(entryPoint: string): this {
        this.entryPoint = entryPoint;
        return this;
    }

    build(): GPUComputePipeline {
        if (!this.shaderModule) {
            throw new Error('Shader module is required for compute pipeline');
        }

        return this.device.createComputePipeline({
            layout: this.layout,
            compute: {
                module: this.shaderModule,
                entryPoint: this.entryPoint
            }
        });
    }

    buildAsync(): Promise<GPUComputePipeline> {
        if (!this.shaderModule) {
            throw new Error('Shader module is required for compute pipeline');
        }
        return this.device.createComputePipelineAsync({
            layout: this.layout,
            compute: {
                module: this.shaderModule,
                entryPoint: this.entryPoint
            }
        });
    }
}
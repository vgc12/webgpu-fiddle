import type {VertexBufferLayout} from "@/graphics/vertex-buffer-layout.tsx";

export class RenderPipelineBuilder {
    private layout: GPUPipelineLayout | 'auto' = 'auto';
    private vertexShaderModule: GPUShaderModule | null = null;
    private fragmentShaderModule: GPUShaderModule | null = null;
    private vertexEntryPoint: string = 'vertexMain';
    private fragmentEntryPoint: string = 'fragmentMain';
    private vertexBuffers: VertexBufferLayout[] = [];
    private format: GPUTextureFormat;
    private topology: GPUPrimitiveTopology = 'triangle-list';
    private cullMode: GPUCullMode | undefined = undefined;

    constructor(private device: GPUDevice, format: GPUTextureFormat) {
        this.format = format;
    }

    setLayout(layout: GPUPipelineLayout | 'auto'): this {
        this.layout = layout;
        return this;
    }

    setVertexShaderModule(module: GPUShaderModule): this {
        this.vertexShaderModule = module;
        return this;
    }

    setFragmentShaderModule(module: GPUShaderModule): this {
        this.fragmentShaderModule = module;
        return this;
    }

    setVertexEntryPoint(entryPoint: string): this {
        this.vertexEntryPoint = entryPoint;
        return this;
    }

    setFragmentEntryPoint(entryPoint: string): this {
        this.fragmentEntryPoint = entryPoint;
        return this;
    }

    addVertexBuffer(layout: VertexBufferLayout): this {
        this.vertexBuffers.push(layout);
        return this;
    }

    setTopology(topology: GPUPrimitiveTopology): this {
        this.topology = topology;
        return this;
    }

    setCullMode(cullMode: GPUCullMode): this {
        this.cullMode = cullMode;
        return this;
    }

    setFormat(format: GPUTextureFormat): this {
        this.format = format;
        return this;
    }

    buildAsync(): Promise<GPURenderPipeline> {

        const pld = this.getRenderPipelineDescriptor();
        if (!pld) {
            throw new Error('Failed to create render pipeline descriptor');
        }
        return this.device.createRenderPipelineAsync(pld);
    }

    build(): GPURenderPipeline {
        const pld = this.getRenderPipelineDescriptor();
        if (!pld) {
            throw new Error('Failed to create render pipeline descriptor');
        }

        return this.device.createRenderPipeline(pld);
    }

    private getRenderPipelineDescriptor(): GPURenderPipelineDescriptor | null {
        if (!this.vertexShaderModule) {
            throw new Error('Vertex shader module is required for render pipeline');
        }
        if (!this.fragmentShaderModule) {
            throw new Error('Fragment shader module is required for render pipeline');
        }

        return {
            layout: this.layout,
            vertex: {
                module: this.vertexShaderModule,
                entryPoint: this.vertexEntryPoint,
            },
            fragment: {
                module: this.fragmentShaderModule,
                entryPoint: this.fragmentEntryPoint,
                targets: [{format: this.format}]
            },
            primitive: {
                topology: this.topology,
                cullMode: this.cullMode
            }
        }
    }

}
import type {VertexBufferLayout} from "@/components/graphics/vertex-buffer-layout.tsx";

export class RenderPipelineBuilder {
    private layout: GPUPipelineLayout | 'auto' = 'auto';
    private shaderModule: GPUShaderModule | null = null;
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

    setShaderModule(module: GPUShaderModule): this {
        this.shaderModule = module;
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

    build(): GPURenderPipeline {
        if (!this.shaderModule) {
            throw new Error('Shader module is required for render pipeline');
        }

        return this.device.createRenderPipeline({
            layout: this.layout,
            vertex: {
                module: this.shaderModule,
                entryPoint: this.vertexEntryPoint,
                buffers: this.vertexBuffers
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: this.fragmentEntryPoint,
                targets: [{format: this.format}]
            },
            primitive: {
                topology: this.topology,
                cullMode: this.cullMode
            }
        });
    }
}
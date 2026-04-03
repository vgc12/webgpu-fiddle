import {InputOutputBuffers, UniformBuffer} from "@/graphics/input-output-buffers.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";
import type {StructField} from "@/graphics/shader-builder.tsx";
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import type {IPipelineStrategy, IRenderStrategy, IResourceStrategy, IUpdateStrategy} from "./rendering-strategies";
import {calculateWorkgroupCount} from "./workgroup-utils";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import {ComputePipelineBuilder} from "@/graphics/compute-pipeline-builder.tsx";
import {RenderPipelineBuilder} from "@/graphics/render-pipeline-builder.tsx";
import {
    createParticleComputeBindGroups,
    createParticleComputeLayout,
    createParticleRenderBindGroup,
    createParticleRenderLayout
} from "@/graphics/particle-bind-group-functions.tsx";

type base_type = 'f32' | 'u32' | 'i32';

function getFieldComponents(type: string): { count: number; baseType: base_type } {
    if (type === 'f32') return { count: 1, baseType: 'f32' };
    if (type === 'u32') return { count: 1, baseType: 'u32' };
    if (type === 'i32') return { count: 1, baseType: 'i32' };

    const vecMatch = type.match(/vec(\d)(?:<(\w+)>|([fiu]))/);
    if (vecMatch) {
        const count = parseInt(vecMatch[1]);
        const inner = vecMatch[2] || ({ f: 'f32', i: 'i32', u: 'u32' } as Record<string, string>)[vecMatch[3]];
        return { count, baseType: inner as base_type };
    }

    return { count: 1, baseType: 'f32' };
}

function writeTypedValue(view: DataView, byteOffset: number, value: number, baseType: base_type): void {
    switch (baseType) {
        case 'u32': view.setUint32(byteOffset, value >>> 0, true); break;
        case 'i32': view.setInt32(byteOffset, value | 0, true); break;
        case 'f32': view.setFloat32(byteOffset, value, true); break;
    }
}

function resolveFieldValue(fieldValue: any, componentIndex: number, componentCount: number): number {
    if (fieldValue == null) return 0;
    if (componentCount === 1) return typeof fieldValue === 'number' ? fieldValue : 0;
    return Array.isArray(fieldValue) && componentIndex < fieldValue.length ? fieldValue[componentIndex] : 0;
}

function randomValueForType(baseType: base_type): number {
    return baseType === 'f32' ? Math.random() * 2 - 1 : (Math.random() > 0.7 ? 1 : 0);
}

type value_source = (fieldIndex: number, componentIndex: number, count: number, baseType: base_type) => number;

function writeStructInstance(view: DataView, structOffset: number, fields: StructField[], getValue: value_source): void {
    for (let f = 0; f < fields.length; f++) {
        const field = fields[f];
        const { count, baseType } = getFieldComponents(field.type);

        for (let c = 0; c < count; c++) {
            writeTypedValue(view, structOffset + field.offset + c * 4, getValue(f, c, count, baseType), baseType);
        }
    }
}

export class ParticlePipelineStrategy implements IPipelineStrategy {
    async createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: {
            format: GPUTextureFormat;
            computeBindGroupLayout: GPUBindGroupLayout;
            renderBindGroupLayout: GPUBindGroupLayout
        }
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
            bindGroupLayouts: [context.computeBindGroupLayout]
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

export class ParticleResourceStrategy implements IResourceStrategy {
    private inOutBuffer: InputOutputBuffers;
    private uniformBuffer: UniformBuffer;
    private renderBindGroup: GPUBindGroup;
    private computeBindGroupA: GPUBindGroup;
    private computeBindGroupB: GPUBindGroup;
    private renderLayout: GPUBindGroupLayout;
    private computeLayout: GPUBindGroupLayout;

    constructor(private computeConfig: ComputeConfig, private particleCount: number) {}

    initializeResources(device: GPUDevice, resourceManager: GPUResourceManager, _config: {
        resolution: { width: number; height: number }
    }): void {
        this.computeLayout = createParticleComputeLayout(device);
        this.renderLayout = createParticleRenderLayout(device);

        this.inOutBuffer = new InputOutputBuffers(device, resourceManager, this.computeConfig);
        this.uniformBuffer = new UniformBuffer(device, resourceManager);
        this.writeInitialData();

        const bufferRefs = {
            device,
            uniformBuffer: this.uniformBuffer,
            particleBuffer: this.inOutBuffer,
        };

        [this.computeBindGroupA, this.computeBindGroupB] = createParticleComputeBindGroups(
            bufferRefs, this.computeLayout
        );
        this.renderBindGroup = createParticleRenderBindGroup(
            bufferRefs, this.renderLayout
        );
    }

    cleanup(): void {
        this.inOutBuffer?.destroy();
    }

    get BindGroups(): { compute: GPUBindGroup[], render: GPUBindGroup[] } {
        return {
            compute: [this.computeBindGroupA, this.computeBindGroupB],
            render: [this.renderBindGroup]
        };
    }

    getInOutBuffer(): InputOutputBuffers {
        return this.inOutBuffer;
    }

    get UniformBuffer(): UniformBuffer {
        return this.uniformBuffer;
    }

    getComputeBindGroupLayout(): GPUBindGroupLayout {
        return this.computeLayout;
    }

    getRenderBindGroupLayout(): GPUBindGroupLayout {
        return this.renderLayout;
    }

    private writeInitialData(): void {
        const struct = this.computeConfig.inOutBufferStruct;
        if (!struct) {
            throw new Error("inOutBufferStruct is null! Could not find struct in shader!");
        }

        const buffer = new ArrayBuffer(this.particleCount * struct.size);
        const view = new DataView(buffer);
        const jsonData = this.computeConfig.initialData;

        for (let i = 0; i < this.particleCount; i++) {
            const getValue = jsonData !== null
                ? this.jsonValueSource(jsonData, i, struct.fields.length === 1)
                : (_f: number, _c: number, _count: number, baseType: base_type) => randomValueForType(baseType);

            writeStructInstance(view, i * struct.size, struct.fields, getValue);
        }

        this.inOutBuffer.writeBuffer(new Float32Array(buffer));
    }

    private jsonValueSource(jsonData: any[], instanceIndex: number, isSingleField: boolean): value_source {
        const instance = instanceIndex < jsonData.length ? jsonData[instanceIndex] : null;

        return (fieldIndex, componentIndex, count, _baseType) => {
            const fieldValue = instance == null
                ? null
                : isSingleField ? instance : instance[fieldIndex];

            return resolveFieldValue(fieldValue, componentIndex, count);
        };
    }
}

export class NullUpdateStrategy implements IUpdateStrategy {
    public update(): void {
    }
}

export class ParticleComputeUpdateStrategy implements IUpdateStrategy {
    private pingPong: PingPongBindGroups

    constructor(
        private computeConfig: ComputeConfig,
        private resourceStrategy: ParticleResourceStrategy,
        private particleCount: number
    ) {}

    update(encoder: GPUCommandEncoder, pipeline: GPUComputePipeline): void {
        if (!this.pingPong) {
            const bindGroups = this.resourceStrategy.BindGroups.compute;
            this.pingPong = new PingPongBindGroups(bindGroups as [GPUBindGroup, GPUBindGroup]);
        }

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(pipeline);
        computePass.setBindGroup(0, this.pingPong.getNext());

        const workgroupCount = calculateWorkgroupCount(
            this.particleCount,
            this.computeConfig.workgroupSize
        );
        computePass.dispatchWorkgroups(...workgroupCount);
        computePass.end();

        this.resourceStrategy.getInOutBuffer().swap();
    }
}


export class ParticleRenderStrategy implements IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
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

export class PingPongBindGroups {
    private current = 0;

    constructor(
        private readonly bindGroups: [GPUBindGroup, GPUBindGroup]
    ) {}

    getNext(): GPUBindGroup {
        const bindGroup = this.bindGroups[this.current];
        this.current = (this.current + 1) % 2;
        return bindGroup;
    }

    getCurrent(): GPUBindGroup {
        return this.bindGroups[this.current];
    }

    reset(): void {
        this.current = 0;
    }
}
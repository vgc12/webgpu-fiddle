import type {IResourceStrategy, PipelineContext} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import {InputOutputBuffers, UniformBuffer} from "@/graphics/pipelines/input-output-buffers.tsx";
import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import {
    createParticleComputeBindGroups,
    createParticleComputeLayout,
    createParticleRenderBindGroup,
    createParticleRenderLayout
} from "@/graphics/renderers/bind-groups/particle-bind-group-functions.tsx";
import {
    type base_type,
    jsonValueSource,
    randomValueForType,
    type value_source,
    writeStructInstance
} from "@/graphics/utils/buffer-writer.tsx";

export class ParticleResourceStrategy implements IResourceStrategy {
    private inOutBuffer: InputOutputBuffers;
    private uniformBuffer: UniformBuffer;
    private renderBindGroup: GPUBindGroup;
    private computeBindGroupA: GPUBindGroup;
    private computeBindGroupB: GPUBindGroup;
    private renderLayout: GPUBindGroupLayout;
    private computeLayout: GPUBindGroupLayout;
    private backgroundBindGroup: GPUBindGroup;

    constructor(private computeConfig: ComputeConfig, private particleCount: number) {
    }

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

        // Background bind group: only needs the uniform buffer
        const bgLayout = device.createBindGroupLayout({
            label: 'Background Render Layout',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {type: 'uniform'}
            }]
        });
        this.backgroundBindGroup = device.createBindGroup({
            label: 'Background Bind Group',
            layout: bgLayout,
            entries: [
                {binding: 0, resource: {buffer: this.uniformBuffer.Buffer}}
            ]
        });
    }

    cleanup(): void {
        this.inOutBuffer?.destroy();
    }

    postUpdate(): void {
        this.inOutBuffer.swap();
    }

    getPipelineContext(format: GPUTextureFormat): PipelineContext {
        return {
            format,
            computeBindGroupLayout: this.computeLayout,
            renderBindGroupLayout: this.renderLayout,
        };
    }

    get BindGroups(): { compute: GPUBindGroup[], render: GPUBindGroup[], background: GPUBindGroup[] } {
        return {
            compute: [this.computeBindGroupA, this.computeBindGroupB],
            render: [this.renderBindGroup],
            background: [this.backgroundBindGroup],
        };
    }

    get UniformBuffer(): UniformBuffer {
        return this.uniformBuffer;
    }

    private writeInitialData(): void {
        const struct = this.computeConfig.inOutBufferStruct;
        if (!struct) {
            throw new Error("inOutBufferStruct is null! Could not find struct in shader!");
        }

        const buffer = new ArrayBuffer(this.particleCount * struct.size);
        const view = new DataView(buffer);
        const jsonData = this.computeConfig.initialData;
        const isSingleField = struct.fields.length === 1;

        const makeGetValue: (i: number) => value_source = jsonData !== null
            ? (i) => jsonValueSource(jsonData, i, isSingleField)
            : () => (_f: number, _c: number, _count: number, baseType: base_type) => randomValueForType(baseType);

        for (let i = 0; i < this.particleCount; i++) {
            writeStructInstance(view, i * struct.size, struct.fields, makeGetValue(i));
        }

        this.inOutBuffer.writeBuffer(new Float32Array(buffer));
    }
}

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

/** Resource strategy for particle renderers. Creates the uniform buffer, double-buffered input/output storage buffers, and bind groups for compute, render, and background passes. Writes initial particle data (from JSON or random values) into the buffers on creation. */
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

    /** Creates all GPU resources: layouts, buffers, bind groups, and writes initial particle data. */
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

    /** Destroys the input/output storage buffers. */
    cleanup(): void {
        this.inOutBuffer?.destroy();
    }

    /** Swaps the input/output buffers after each compute dispatch. */
    postUpdate(): void {
        this.inOutBuffer.swap();
    }

    /** Returns the pipeline context with compute and render bind group layouts. */
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

    /** Fills Buffer A with initial particle data. If JSON data is provided, uses it; otherwise generates random values based on each field's type. When JSON data is smaller than the buffer and both sizes are perfect squares, the data is treated as a 2D grid placed in the top-left corner with zero padding. */
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
            ? (i) => jsonValueSource(this.remapIndex(jsonData, i), jsonData, isSingleField)
            : () => (_f: number, _c: number, _count: number, baseType: base_type) => randomValueForType(baseType);


        for (let i = 0; i < this.particleCount; i++) {
            writeStructInstance(view, i * struct.size, struct.fields, makeGetValue(i));

        }

        this.inOutBuffer.writeBuffer(new Float32Array(buffer));
    }

    /** Maps a destination buffer index to a source JSON index. When the JSON data represents a smaller square grid, converts via 2D coordinates so the pattern sits in the top-left corner. Returns -1 for cells outside the source grid. */
    private remapIndex(jsonData: any[], destIndex: number): number {
        if (jsonData.length === this.particleCount) {
            return destIndex;
        }

        const srcSide = Math.sqrt(jsonData.length);
        const destSide = Math.sqrt(this.particleCount);
        const bothSquare = Number.isInteger(srcSide) && Number.isInteger(destSide);

        if (!bothSquare) {
            return destIndex < jsonData.length ? destIndex : -1;
        }

        const destX = destIndex % destSide;
        const destY = Math.floor(destIndex / destSide);

        if (destX >= srcSide || destY >= srcSide) {
            return -1;
        }

        return destY * srcSide + destX;
    }
}

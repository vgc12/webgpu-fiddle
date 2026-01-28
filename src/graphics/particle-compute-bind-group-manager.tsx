import {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import {type InOutBuffer, UniformBuffer} from "@/graphics/in-out-buffer.tsx";

export class ParticleRenderBindGroupManager {
    layout: GPUBindGroupLayout;
    private bindGroup: GPUBindGroup;

    constructor(
        private resourceManager: GPUResourceManager,
        private uniformBuffer: UniformBuffer,
        private inOutBuffer: InOutBuffer,
        private device: GPUDevice,
    ) {
        this.createBindGroups();
    }

    get BindGroup(): GPUBindGroup {
        return this.bindGroup;
    }

    createBindGroups(): GPUBindGroup[] {


        this.layout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {type: 'uniform', hasDynamicOffset: false},
            },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {type: 'read-only-storage', hasDynamicOffset: false},
                }
            ]
        })

        this.bindGroup = this.resourceManager.createBindGroup(
            this.layout,
            [
                {binding: 0, resource: {buffer: this.uniformBuffer.Buffer}},
                {binding: 1, resource: {buffer: this.inOutBuffer.OutputBuffer}},
            ],
            'Render Bind Group'
        );
        return [this.bindGroup]
    }
}

export class ParticleComputeBindGroupManager {
    layout: GPUBindGroupLayout;
    private bindGroupA: GPUBindGroup;
    private bindGroupB: GPUBindGroup;
    private useBindGroupA: boolean = true

    constructor(
        private resourceManager: GPUResourceManager,
        private particleBufferSystem: InOutBuffer,
        private uniformsBuffer: UniformBuffer,
        private device: GPUDevice
    ) {
        this.createBindGroups();
    }

    get BindGroup(): GPUBindGroup {
        const bindGroup: GPUBindGroup = this.useBindGroupA ? this.bindGroupA : this.bindGroupB;
        this.useBindGroupA = !this.useBindGroupA;
        return bindGroup;
    }

    createBindGroups(): GPUBindGroup[] {

        this.layout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {type: 'uniform', hasDynamicOffset: false},
            },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {type: 'read-only-storage', hasDynamicOffset: false},
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {type: 'storage', hasDynamicOffset: false}
                }
            ]
        });
        // Bind group A: read from current read buffer, write to write buffer
        this.bindGroupA = this.resourceManager.createBindGroup(
            this.layout,
            [
                {binding: 0, resource: {buffer: this.uniformsBuffer.Buffer}},
                {binding: 1, resource: {buffer: this.particleBufferSystem.InputBuffer}},
                {binding: 2, resource: {buffer: this.particleBufferSystem.OutputBuffer}}
            ],
            'Bind Group A'
        );

        // Bind group B: after swap, read/write buffers are reversed
        this.particleBufferSystem.swap()
        this.bindGroupB = this.resourceManager.createBindGroup(
            this.layout,
            [
                {binding: 0, resource: {buffer: this.uniformsBuffer.Buffer}},
                {binding: 1, resource: {buffer: this.particleBufferSystem.InputBuffer}},
                {binding: 2, resource: {buffer: this.particleBufferSystem.OutputBuffer}}
            ],
            'Bind Group B'
        );
        this.particleBufferSystem.swap(); // Swap back to initial state
        return [this.bindGroupA, this.bindGroupB]
    }
}
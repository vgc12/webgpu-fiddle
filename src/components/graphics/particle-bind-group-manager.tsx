import type {IBindGroupManager} from "@/components/graphics/i-bind-group-manager.tsx";
import {GPUResourceManager} from "@/components/graphics/gpu-resource-manager.tsx";
import type {ParticleComputeBufferSystem} from "@/components/graphics/particle-compute-buffer-system.tsx";

export class ParticleBindGroupManager implements IBindGroupManager {
    private bindGroupA: GPUBindGroup;
    private bindGroupB: GPUBindGroup;
    private useBindGroupA : boolean = true
    constructor(
        private resourceManager: GPUResourceManager,
        pipeline: GPUComputePipeline,
        particleBufferSystem: ParticleComputeBufferSystem
    ) {
        this.createBindGroups(pipeline, particleBufferSystem);
    }

    createBindGroups(
        pipeline: GPUComputePipeline,
        particleBufferSystem: ParticleComputeBufferSystem
    ): GPUBindGroup[] {
        const layout = pipeline.getBindGroupLayout(0);

        // Bind group A: read from current read buffer, write to write buffer
        this.bindGroupA = this.resourceManager.createBindGroup(
            layout,
            [
                {binding: 0, resource: {buffer: particleBufferSystem.InputBuffer}},
                {binding: 1, resource: {buffer: particleBufferSystem.OutputBuffer}}
            ],
            'Bind Group A'
        );

        // Bind group B: after swap, read/write buffers are reversed
        particleBufferSystem.swap()
        this.bindGroupB = this.resourceManager.createBindGroup(
            layout,
            [
                {binding: 0, resource: {buffer: particleBufferSystem.InputBuffer}},
                {binding: 1, resource: {buffer: particleBufferSystem.OutputBuffer}}
            ],
            'Bind Group B'
        );
        particleBufferSystem.swap(); // Swap back to initial state
        return [this.bindGroupA, this.bindGroupB]
    }

    getBindGroup(): GPUBindGroup {
        const bindGroup :GPUBindGroup = this.useBindGroupA? this.bindGroupA : this.bindGroupB;
        this.useBindGroupA = !this.useBindGroupA;
        return bindGroup;
    }
}
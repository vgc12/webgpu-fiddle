import type {ParticleComputeBufferSystem} from "@/components/graphics/particle-compute-buffer-system.tsx";

export interface IBindGroupManager {
    createBindGroups(pipeline: GPUPipelineBase, particleBuffer: ParticleComputeBufferSystem): GPUBindGroup[]
}
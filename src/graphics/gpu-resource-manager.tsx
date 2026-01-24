export class GPUResourceManager {
    constructor(private device: GPUDevice) {
    }

    createBuffer(size: number, usage: GPUBufferUsageFlags, label?: string): GPUBuffer {
        return this.device.createBuffer({
            size,
            usage,
            label
        });
    }

    createShaderModule(code: string, label: string): GPUShaderModule {
        return this.device.createShaderModule({code, label});
    }

    createBindGroup(
        layout: GPUBindGroupLayout,
        entries: GPUBindGroupEntry[],
        label?: string
    ): GPUBindGroup {
        return this.device.createBindGroup({layout, entries, label});
    }
}
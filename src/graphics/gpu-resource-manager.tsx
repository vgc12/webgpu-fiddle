/** Wrapper around GPUDevice providing a consistent API for creating GPU resources. */
export class GPUResourceManager {
    constructor(private device: GPUDevice) {
    }

    /** Allocate a GPU buffer with the given size and usage flags. */
    createBuffer(size: number, usage: GPUBufferUsageFlags, label?: string): GPUBuffer {
        return this.device.createBuffer({
            size,
            usage,
            label
        });
    }

    /** Compile WGSL source code into a GPU shader module. */
    createShaderModule(code: string, label: string): GPUShaderModule {
        return this.device.createShaderModule({code, label});
    }

}
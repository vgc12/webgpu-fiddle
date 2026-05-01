// Thin wrapper around GPUDevice that provides a consistent API for creating
// GPU resources (buffers, shader modules, bind groups). Used by the resource
// strategies so they don't interact with the raw device directly.
export class GPUResourceManager {
    constructor(private device: GPUDevice) {
    }

    // Allocate a GPU buffer with the given size and usage flags (e.g. UNIFORM, STORAGE, COPY_DST).
    createBuffer(size: number, usage: GPUBufferUsageFlags, label?: string): GPUBuffer {
        return this.device.createBuffer({
            size,
            usage,
            label
        });
    }

    // Compile WGSL source code into a GPU shader module.
    createShaderModule(code: string, label: string): GPUShaderModule {
        return this.device.createShaderModule({code, label});
    }

}
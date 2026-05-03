import type {UniformBuffer} from "@/graphics/pipelines/input-output-buffers.tsx";

/** Configuration for creating canvas renderer bind groups. */
export interface CanvasBindGroupConfig {
    uniformBuffer: UniformBuffer;
    device: GPUDevice;
}

/** Creates a bind group for the canvas renderer with the uniform buffer at binding 0. */
export function createCanvasRenderBindGroup(config: CanvasBindGroupConfig, layout: GPUBindGroupLayout): GPUBindGroup {
    return config.device.createBindGroup({
        label: 'Canvas Render BindGroup',
        layout,
        entries: [
            {binding: 0, resource: {buffer: config.uniformBuffer.Buffer}},
        ]
    })
}


/** Creates the bind group layout for the canvas renderer (uniform buffer visible to vertex + fragment). */
export function createCanvasRenderLayout(device: GPUDevice): GPUBindGroupLayout {
    return device.createBindGroupLayout({
        label: 'Canvas Render Layout',
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {type: 'uniform'}
        }]

    })
}

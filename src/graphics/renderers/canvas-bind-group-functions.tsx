import type {UniformBuffer} from "@/graphics/pipelines/input-output-buffers.tsx";

export interface CanvasBindGroupConfig {
    uniformBuffer: UniformBuffer;
    device: GPUDevice;
}

export function createCanvasRenderBindGroup(config: CanvasBindGroupConfig, layout: GPUBindGroupLayout): GPUBindGroup {
    return config.device.createBindGroup({
        label: 'Canvas Render BindGroup',
        layout,
        entries: [
            {binding: 0, resource: {buffer: config.uniformBuffer.Buffer}},
        ]
    })
}


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

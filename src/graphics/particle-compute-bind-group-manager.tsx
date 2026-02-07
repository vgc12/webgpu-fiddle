import type {InputOutputBuffers, UniformBuffer} from "@/graphics/input-output-buffers.tsx";

/**
 * Bind group configuration for particle rendering
 */
export interface ParticleBindGroupConfig {
    uniformBuffer: UniformBuffer;
    particleBuffer: InputOutputBuffers;
    device: GPUDevice;
}

export interface CanvasBindGroupConfig {
    uniformBuffer: UniformBuffer;
    device: GPUDevice;
}



/**
 * Creates bind group layout for particle rendering
 */
export function createParticleRenderLayout(device: GPUDevice): GPUBindGroupLayout {
    return device.createBindGroupLayout({
        label: 'Particle Render Layout',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {type: 'uniform'}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {type: 'read-only-storage'}
            }
        ]
    });
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

/**
 * Creates bind group layout for particle compute
 */
export function createParticleComputeLayout(device: GPUDevice): GPUBindGroupLayout {
    return device.createBindGroupLayout({
        label: 'Particle Compute Layout',
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {type: 'uniform'}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {type: 'read-only-storage'}
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {type: 'storage'}
            }
        ]
    });
}

/**
 * Creates bind group for particle rendering
 */
export function createParticleRenderBindGroup(
    config: ParticleBindGroupConfig,
    layout: GPUBindGroupLayout
): GPUBindGroup {
    return config.device.createBindGroup({
        label: 'Particle Render Bind Group',
        layout,
        entries: [
            {binding: 0, resource: {buffer: config.uniformBuffer.Buffer}},
            {binding: 1, resource: {buffer: config.particleBuffer.OutputBuffer}}
        ]
    });
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

/**
 * Creates ping-pong bind groups for particle compute
 * Returns [bindGroupA, bindGroupB] for double buffering
 */
export function createParticleComputeBindGroups(
    config: ParticleBindGroupConfig,
    layout: GPUBindGroupLayout
): [GPUBindGroup, GPUBindGroup] {
    const {device, uniformBuffer, particleBuffer} = config;

    // Bind group A: current state
    const bindGroupA = device.createBindGroup({
        label: 'Particle Compute Bind Group A',
        layout,
        entries: [
            {binding: 0, resource: {buffer: uniformBuffer.Buffer}},
            {binding: 1, resource: {buffer: particleBuffer.InputBuffer}},
            {binding: 2, resource: {buffer: particleBuffer.OutputBuffer}}
        ]
    });

    // Bind group B: swapped state (for ping-pong)
    const bindGroupB = device.createBindGroup({
        label: 'Particle Compute Bind Group B',
        layout,
        entries: [
            {binding: 0, resource: {buffer: uniformBuffer.Buffer}},
            {binding: 1, resource: {buffer: particleBuffer.OutputBuffer}}, // Swapped
            {binding: 2, resource: {buffer: particleBuffer.InputBuffer}}   // Swapped
        ]
    });

    return [bindGroupA, bindGroupB];
}


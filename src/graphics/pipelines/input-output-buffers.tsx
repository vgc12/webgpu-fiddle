import {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";

// Common interface for GPU buffer systems (uniform buffers and storage buffers).
export interface IBufferSystem {
    initializeBuffers(): void;

    writeBuffer(data: Float32Array<ArrayBuffer>): void;

    destroy(): void;
}

// Manages a single GPU uniform buffer (32 bytes) that holds per-frame data
// (resolution, mouse position, aspect ratio, time, deltaTime).
// Written to every frame by StrategyBasedRenderer.updateUniforms().
export class UniformBuffer implements IBufferSystem {
    private uniformBuffer: GPUBuffer;

    constructor(private device: GPUDevice, private resourceManager: GPUResourceManager) {
        this.initializeBuffers();
    }

    get Buffer(): GPUBuffer {
        return this.uniformBuffer;
    }

    initializeBuffers(): void {
        const usage: number = GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
        this.uniformBuffer = this.resourceManager.createBuffer(32, usage, "Uniform Buffer")
    }

    writeBuffer(data: Float32Array<ArrayBuffer>) {
        this.device.queue.writeBuffer(this.uniformBuffer, 0, data);
    }

    public destroy(): void {
        this.uniformBuffer.destroy();
    }
}

// Double-buffered storage buffers for compute shader ping-pong.
// Two identically-sized buffers (A and B) alternate between input and output roles.
// After each compute dispatch, swap() flips which is input and which is output,
// so the next frame reads from what was just written.
export class InputOutputBuffers implements IBufferSystem {
    private bufferA: GPUBuffer;
    private bufferB: GPUBuffer;
    private useBufferA: boolean = true;


    constructor(
        private device: GPUDevice,
        private resourceManager: GPUResourceManager,
        private config: ComputeConfig,
    ) {
        this.initializeBuffers();
    }

    get InputBuffer(): GPUBuffer {
        return this.useBufferA ? this.bufferA : this.bufferB;
    }

    get OutputBuffer(): GPUBuffer {
        return this.useBufferA ? this.bufferB : this.bufferA;
    }

    writeBuffer(data: Float32Array<ArrayBuffer>): void {

        this.device.queue.writeBuffer(this.bufferA, 0, data)
    }

    initializeBuffers(): void {
        if (this.config.inOutBufferStruct == null) {
            throw new Error("The buffer struct could not be found in the compute shader!");
        }
        const bufferSize = this.config.particleCount * this.config.inOutBufferStruct.size;
        const usage = GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_DST |
            GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.VERTEX;

        this.bufferA = this.resourceManager.createBuffer(
            bufferSize,
            usage,
            'Particle Buffer A'
        );

        this.bufferB = this.resourceManager.createBuffer(
            bufferSize,
            usage,
            'Particle Buffer B'
        );


    }

    destroy(): void {
        this.bufferA?.destroy();
        this.bufferB?.destroy();
    }

    swap() {
        this.useBufferA = !this.useBufferA;
    }
}
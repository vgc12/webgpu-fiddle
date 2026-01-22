
import {GPUResourceManager} from "@/components/graphics/gpu-resource-manager.tsx";
import type {ParticleConfig} from "@/components/graphics/particle-config.tsx";

export interface IBufferSystem {
    initializeBuffers() : void;
    writeBuffer(data : Float32Array<ArrayBuffer>) : void;
    destroy():void;
}

export class ParticleRenderBufferSystem implements IBufferSystem{
    private uniformBuffer : GPUBuffer;
    constructor(private device: GPUDevice,private resourceManager : GPUResourceManager) {
        this.initializeBuffers();
    }

    private initializeBuffers(): void {
        const usage: number = GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM
        this.uniformBuffer = this.resourceManager.createBuffer(16,usage, "Uniform Buffer")
    }
    
    writeBuffer(data : Float32Array<ArrayBuffer>){
       this.device.queue.writeBuffer(this.uniformBuffer, 0, data);
    }

    public destroy(): void {
        this.uniformBuffer.destroy();
    }
}
export class ParticleComputeBufferSystem implements IBufferSystem{
    private bufferA: GPUBuffer;
    private bufferB: GPUBuffer;
    private useBufferA: boolean = true;

    constructor(
        private device: GPUDevice,
        private resourceManager: GPUResourceManager,
        private config: ParticleConfig
    ) {
        this.initializeBuffers();
    }

    writeBuffer(data: Float32Array<ArrayBuffer>): void {
 
        this.device.queue.writeBuffer(this.bufferA, 0, data)
    }

    initializeBuffers(): void {
        const bufferSize = this.config.count * this.config.particleStructSize;
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

  
    get InputBuffer(): GPUBuffer {
        return this.useBufferA ? this.bufferA : this.bufferB;
    }

    get OutputBuffer(): GPUBuffer {
        return this.useBufferA ? this.bufferB : this.bufferA;
    }
    

    destroy(): void {
        this.bufferA?.destroy();
        this.bufferB?.destroy();
    }

    swap() {
        this.useBufferA = !this.useBufferA;
    }
}
import {
    ComputeParticlePipelineFactory,
    ParticleRenderPipelineFactory,
} from "@/components/graphics/render-pipeline-factory.tsx";
import {ParticleComputeBufferSystem} from "@/components/graphics/particle-compute-buffer-system.tsx";

import {WebGPUContext} from "@/components/graphics/webgpu-context.tsx";
import {AnimationController} from "@/components/graphics/animation-controller.tsx";
import {GPUResourceManager} from "@/components/graphics/gpu-resource-manager.tsx";
import type {IRenderer} from "@/components/graphics/i-renderer.tsx";
import type {ShaderConfig} from "@/components/graphics/shader-config.tsx";
import type {ParticleConfig} from "@/components/graphics/particle-config.tsx";
import {ParticleBindGroupManager} from "@/components/graphics/particle-bind-group-manager.tsx";
import type {IFactory} from "@/components/graphics/i-factory.tsx";

export class WebGPURenderer implements IRenderer {
    private gpuContext: WebGPUContext;
    private resourceManager: GPUResourceManager;
    private renderPipelineFactory: IFactory<GPURenderPipeline>;
    private computePipelineFactory: IFactory<GPUComputePipeline>;
    private bufferSystem: ParticleComputeBufferSystem;
    private bindGroupManager: ParticleBindGroupManager;
    private animationController: AnimationController;

    private computePipeline: GPUComputePipeline;
    private renderPipeline: GPURenderPipeline;
    private initialized: boolean = false;

    constructor(
        canvas: HTMLCanvasElement,
        private shaderConfig: ShaderConfig,
        private particleConfig: ParticleConfig = {
            count: 1000,
            particleStructSize: 16,
            workgroupSize: 64,
            initialVelocityRange: 0.01
        }
    ) {
        this.gpuContext = new WebGPUContext(canvas);
        this.animationController = new AnimationController();
    }

    async start(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
        this.animationController.start(() => this.update());
    }

    private async initialize(): Promise<void> {
        await this.gpuContext.initialize();

        const device = this.gpuContext.getDevice();
        const format = this.gpuContext.getFormat();

        // Create shader modules
        const computeShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.computeShader,
            'Particle Update Shader'
        );

        const graphicsShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.graphicsShader,
            'Particle Vertex Shader'
        );


        this.resourceManager = new GPUResourceManager(device);
        this.renderPipelineFactory = new ParticleRenderPipelineFactory(device, format, graphicsShaderModule);
        this.computePipelineFactory = new ComputeParticlePipelineFactory(device, computeShaderModule);


        // Create pipelines using builder pattern
        this.computePipeline = this.computePipelineFactory.create();
        this.renderPipeline = this.renderPipelineFactory.create();

        // Initialize buffers and bind groups
        this.bufferSystem = new ParticleComputeBufferSystem(
            device,
            this.resourceManager,
            this.particleConfig
        );
        const initialData = new Float32Array(this.particleConfig.count * 4);
        const velocityRange = this.config.initialVelocityRange;

        for (let i = 0; i < this.config.count; i++) {
            const offset = i * 4;
            initialData[offset] = Math.random();     // x position
            initialData[offset + 1] = Math.random(); // y position
            initialData[offset + 2] = (Math.random() - 0.5) * velocityRange; // x velocity
            initialData[offset + 3] = (Math.random() - 0.5) * velocityRange; // y velocity
        }


        this.bufferSystem.writeBuffer(initialData)

        this.bindGroupManager = new ParticleBindGroupManager(
            this.resourceManager,
            this.computePipeline,
            this.bufferSystem
        );

        this.initialized = true;
    }

    private update = () => {
        const context = this.gpuContext.getContext();
        const device = this.gpuContext.getDevice();

        const currentTexture = context.getCurrentTexture();
        const textureView = currentTexture.createView();
        const encoder = device.createCommandEncoder();

        this.executeComputePass(encoder);
        this.executeRenderPass(encoder, textureView);

        device.queue.submit([encoder.finish()]);
        this.bufferSystem.swap();
    }
    useFirst: boolean = true

    private executeComputePass(encoder: GPUCommandEncoder): void {
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);

        const bindGroup = this.bindGroupManager.getBindGroup();
        this.useFirst = !this.useFirst
        computePass.setBindGroup(0, bindGroup);

        const workgroupCount = Math.ceil(
            this.particleConfig.count / this.particleConfig.workgroupSize
        );
        computePass.dispatchWorkgroups(workgroupCount);
        computePass.end();
    }

    private executeRenderPass(encoder: GPUCommandEncoder, textureView: GPUTextureView): void {
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(this.renderPipeline);
        renderPass.setVertexBuffer(0, this.bufferSystem.OutputBuffer);
        renderPass.draw(6, this.particleConfig.count);
        renderPass.end();
    }

    stop(): void {
        this.animationController.stop();
    }

    destroy(): void {
        this.stop();
        this.bufferSystem?.destroy();
        this.gpuContext?.destroy();
    }
}


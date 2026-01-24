import {ComputeParticlePipelineFactory, ParticleRenderPipelineFactory,} from "@/graphics/render-pipeline-factory.tsx";
import {ParticleComputeBuffer, UniformBuffer} from "@/graphics/particle-compute-buffer.tsx";

import {WebGPUContext} from "@/graphics/webgpu-context.tsx";
import {AnimationController} from "@/graphics/animation-controller.tsx";
import {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import type {ParticleConfig} from "@/graphics/particle-config.tsx";
import {
    ParticleComputeBindGroupManager,
    ParticleRenderBindGroupManager
} from "@/graphics/particle-compute-bind-group-manager.tsx";
import type {IFactory} from "@/graphics/i-factory.tsx";

export class WebGPURenderer implements IRenderer {
    useFirst: boolean = true
    private gpuContext: WebGPUContext;
    private resourceManager: GPUResourceManager;
    private renderPipelineFactory: IFactory<GPURenderPipeline>;
    private computePipelineFactory: IFactory<GPUComputePipeline>;
    private computeBuffer: ParticleComputeBuffer;
    private uniformBuffer: UniformBuffer;
    private computeBindGroupManager: ParticleComputeBindGroupManager;
    private animationController: AnimationController;
    private computePipeline: GPUComputePipeline;
    private renderPipeline: GPURenderPipeline;
    private initialized: boolean = false;
    private renderBindGroupManager: ParticleRenderBindGroupManager;


    constructor(
        canvas: HTMLCanvasElement,
        private shaderConfig: ShaderConfig,
        private particleConfig: ParticleConfig = {
            count: 1000,
            particleStructSize: 16,
            workgroupSize: 64,
            initialVelocityRange: 0.01
        },
        private resolution: { width: number, height: number } = {width: 1920, height: 1080}
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

    stop(): void {
        this.animationController.stop();
    }

    destroy(): void {
        this.stop();
        this.computeBuffer?.destroy();
        this.gpuContext?.destroy();
    }

    private async initialize(): Promise<void> {
        await this.gpuContext.initialize();

        const device = this.gpuContext.Device;
        const format = this.gpuContext.Format;
        this.resourceManager = new GPUResourceManager(device);

        // Create shader modules
        const computeShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.computeShader,
            'Particle Update Shader'
        );

        const graphicsShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.graphicsShader,
            'Particle Vertex Shader'
        );


        // Initialize buffers and bind groups
        this.computeBuffer = new ParticleComputeBuffer(
            device,
            this.resourceManager,
            this.particleConfig
        );

        this.uniformBuffer = new UniformBuffer(device, this.resourceManager);

        // this probably needs to move but it initializes the particle data and writes to the buffer in the compute shader
        const initialData = new Float32Array(this.particleConfig.count * 4);
        const velocityRange = this.particleConfig.initialVelocityRange;

        for (let i = 0; i < this.particleConfig.count; i++) {
            const offset = i * 4;
            initialData[offset] = Math.random();     // x position
            initialData[offset + 1] = Math.random(); // y position
            initialData[offset + 2] = (Math.random() - 0.5) * velocityRange; // x velocity
            initialData[offset + 3] = (Math.random() - 0.5) * velocityRange; // y velocity
        }


        this.computeBuffer.writeBuffer(initialData)

        const uniformData = new Float32Array([this.resolution.width, this.resolution.height, this.resolution.width / this.resolution.height, 0]);

        this.uniformBuffer.writeBuffer(uniformData);


        this.computeBindGroupManager = new ParticleComputeBindGroupManager(
            this.resourceManager,
            this.computeBuffer,
            this.uniformBuffer,
            device
        );


        this.renderBindGroupManager = new ParticleRenderBindGroupManager(
            this.resourceManager,
            this.uniformBuffer,
            device
        );

        const computePipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [this.computeBindGroupManager.layout]
        });

        const renderPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [this.renderBindGroupManager.layout]
        });


        this.computePipelineFactory = new ComputeParticlePipelineFactory(device, computeShaderModule, computePipelineLayout);
        this.renderPipelineFactory = new ParticleRenderPipelineFactory(device, format, graphicsShaderModule, renderPipelineLayout);

        // Create pipelines using builder pattern
        this.computePipeline = this.computePipelineFactory.create();
        this.renderPipeline = this.renderPipelineFactory.create();

        this.initialized = true;
    }

    private update = () => {
        const context = this.gpuContext.Context;
        const device = this.gpuContext.Device;

        const currentTexture = context.getCurrentTexture();
        const textureView = currentTexture.createView();
        const encoder = device.createCommandEncoder();

        this.executeComputePass(encoder);
        this.executeRenderPass(encoder, textureView);

        device.queue.submit([encoder.finish()]);
        this.computeBuffer.swap();
    }

    private executeComputePass(encoder: GPUCommandEncoder): void {
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);

        const bindGroup = this.computeBindGroupManager.BindGroup;
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
        renderPass.setBindGroup(0, this.renderBindGroupManager.BindGroup);
        renderPass.setVertexBuffer(0, this.computeBuffer.OutputBuffer);
        renderPass.draw(6, this.particleConfig.count);
        renderPass.end();
    }
}


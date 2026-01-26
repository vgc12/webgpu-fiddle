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
import {Time} from "@/utils/time.ts";

// BaseWebGPURenderer.ts
export abstract class BaseWebGPURenderer implements IRenderer {
    protected gpuContext: WebGPUContext;
    protected resourceManager: GPUResourceManager;
    protected animationController: AnimationController;
    protected time: Time;
    protected initialized: boolean = false;

    protected constructor(
        canvas: HTMLCanvasElement,
        protected shaderConfig: ShaderConfig,
        protected resolution: { width: number, height: number } = {width: 1920, height: 1080}
    ) {
        this.time = new Time();

        this.gpuContext = new WebGPUContext(canvas);
        this.animationController = new AnimationController();
    }

    async start(): Promise<void> {
        this.time.start();
        await this.initialize();
        this.animationController.start(this.update);
    }

    stop(): void {
        this.time.stop();
        this.animationController.stop();
    }

    destroy(): void {
        this.stop();
        this.cleanup();
        this.gpuContext?.destroy();
    }

    async initialize(): Promise<void> {
        await this.gpuContext.initialize();
        this.resourceManager = new GPUResourceManager(this.gpuContext.Device);
        await this.initializeResources();
        this.initialized = true;
    }

    abstract recompileShaders(newShaderConfig: ShaderConfig): Promise<void>;

    // Abstract methods each renderer must implement
    protected abstract initializeResources(): Promise<void>;

    protected abstract update(): void;

    protected abstract cleanup(): void;
}


export class ParticleRenderer extends BaseWebGPURenderer {
    private computeBuffer: ParticleComputeBuffer;
    private uniformBuffer: UniformBuffer;
    private computeBindGroupManager: ParticleComputeBindGroupManager;
    private renderBindGroupManager: ParticleRenderBindGroupManager;
    private computePipelineFactory: IFactory<GPUComputePipeline>;
    private renderPipelineFactory: IFactory<GPURenderPipeline>;
    private computePipeline: GPUComputePipeline;
    private renderPipeline: GPURenderPipeline;
    private useFirst: boolean = true;

    constructor(
        canvas: HTMLCanvasElement,
        shaderConfig: ShaderConfig,
        private particleConfig: ParticleConfig = {
            count: 1000,
            particleStructSize: 16,
            workgroupSize: 64,
            initialVelocityRange: 0.01
        },
        resolution?: { width: number, height: number }
    ) {
        super(canvas, shaderConfig, resolution);
    }

    async recompileShaders(newShaderConfig: ShaderConfig): Promise<void> {
        this.shaderConfig = newShaderConfig;
        this.createPipelines();
        this.writeInitialParticleData();
    }

    protected async initializeResources(): Promise<void> {
        const device = this.gpuContext.Device;


        // Initialize buffers
        this.computeBuffer = new ParticleComputeBuffer(
            device,
            this.resourceManager,
            this.particleConfig
        );

        this.uniformBuffer = new UniformBuffer(device, this.resourceManager);

        // Initialize particle data
        this.writeInitialParticleData();
        this.writeUniformData();

        // Create bind group managers
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
        await this.createPipelines();

    }

    protected cleanup(): void {
        this.computeBuffer?.destroy();
    }

    protected update = (): void => {
        const context = this.gpuContext.Context;
        const device = this.gpuContext.Device;

        // Update uniforms with current time
        this.writeUniformData();

        const currentTexture = context.getCurrentTexture();
        const textureView = currentTexture.createView();
        const encoder = device.createCommandEncoder();

        // Execute compute pass to update particles
        this.executeComputePass(encoder);

        // Execute render pass to draw particles
        this.executeRenderPass(encoder, textureView);

        device.queue.submit([encoder.finish()]);

        // Swap buffers for ping-pong pattern
        this.computeBuffer.swap();
    }

    private writeUniformData(): void {
        const uniformData = new Float32Array([
            this.resolution.width,
            this.resolution.height,
            this.resolution.width / this.resolution.height,
            this.time.TotalTime
        ]);

        this.uniformBuffer.writeBuffer(uniformData);
    }

    private writeInitialParticleData(): void {
        const initialData = new Float32Array(this.particleConfig.count * 4);
        const velocityRange = this.particleConfig.initialVelocityRange;

        for (let i = 0; i < this.particleConfig.count; i++) {
            const offset = i * 4;
            initialData[offset] = Math.random();     // x position
            initialData[offset + 1] = Math.random(); // y position
            initialData[offset + 2] = (Math.random() - 0.5) * velocityRange; // x velocity
            initialData[offset + 3] = (Math.random() - 0.5) * velocityRange; // y velocity
        }

        this.computeBuffer.writeBuffer(initialData);
    }

    private async createPipelines(): Promise<void> {
        const device = this.gpuContext.Device;
        const format = this.gpuContext.Format;

        // Create shader modules
        const computeShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.computeShader,
            'Particle Update Shader'
        );

        const graphicsShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.graphicsShader,
            'Particle Vertex Shader'
        );

        // Create pipeline layouts
        const computePipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [this.computeBindGroupManager.layout]
        });

        const renderPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [this.renderBindGroupManager.layout]
        });

        // Create pipeline factories
        this.computePipelineFactory = new ComputeParticlePipelineFactory(
            device,
            computeShaderModule,
            computePipelineLayout
        );

        this.renderPipelineFactory = new ParticleRenderPipelineFactory(
            device,
            format,
            graphicsShaderModule,
            renderPipelineLayout
        );

        // Create pipelines
        this.computePipeline = await this.computePipelineFactory.createAsync();
        this.renderPipeline = await this.renderPipelineFactory.createAsync();
    }

    private executeComputePass(encoder: GPUCommandEncoder): void {
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);

        const bindGroup = this.computeBindGroupManager.BindGroup;
        this.useFirst = !this.useFirst;
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
        renderPass.draw(6, this.particleConfig.count); // 6 vertices per particle (2 triangles)
        renderPass.end();
    }
}
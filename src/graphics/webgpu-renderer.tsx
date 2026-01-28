import {ComputeParticlePipelineFactory, ParticleRenderPipelineFactory,} from "@/graphics/render-pipeline-factory.tsx";
import {InOutBuffer, UniformBuffer} from "@/graphics/in-out-buffer.tsx";

import {WebGPUContext} from "@/graphics/webgpu-context.tsx";
import {AnimationController} from "@/graphics/animation-controller.tsx";
import {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";
import {
    ParticleComputeBindGroupManager,
    ParticleRenderBindGroupManager
} from "@/graphics/particle-compute-bind-group-manager.tsx";
import type {IFactory} from "@/graphics/i-factory.tsx";
import {Time} from "@/utils/time.ts";

const MAX_WORKGROUP_COUNT_PER_DIMENSION = 65535; // WebGPU spec minimum guarantee
const MAX_WORKGROUP_INVOCATIONS = 256; // sizeX × sizeY × sizeZ

function validateAndClampWorkgroupCount(
    count: [number, number, number],
    workgroupSize: [number, number, number]
): [number, number, number] {

    // Validate workgroup size (must be ≤ 256 total invocations)
    const totalInvocations = workgroupSize[0] * workgroupSize[1] * workgroupSize[2];
    if (totalInvocations > MAX_WORKGROUP_INVOCATIONS) {
        throw new Error(
            `Workgroup size ${workgroupSize} exceeds max invocations (${MAX_WORKGROUP_INVOCATIONS}). ` +
            `Got ${totalInvocations}.`
        );
    }

    // Clamp workgroup count per dimension
    const clampedCount: [number, number, number] = [
        Math.min(count[0], MAX_WORKGROUP_COUNT_PER_DIMENSION),
        Math.min(count[1], MAX_WORKGROUP_COUNT_PER_DIMENSION),
        Math.min(count[2], MAX_WORKGROUP_COUNT_PER_DIMENSION)
    ];

    // Warn if clamped
    if (count[0] !== clampedCount[0] ||
        count[1] !== clampedCount[1] ||
        count[2] !== clampedCount[2]) {
        console.warn(
            `Workgroup count ${count} exceeds limits, clamped to ${clampedCount}`
        );
    }

    return clampedCount;
}

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
        this.initializeResources();
        await this.createPipelines();
        this.initialized = true;
    }

    abstract recompileShaders(newShaderConfig: ShaderConfig): Promise<void>;

    abstract recompileShaders(newShaderConfig: ShaderConfig, options?: any): Promise<void>;

    // Abstract methods each renderer must implement
    protected abstract initializeResources(): void;

    protected abstract update(): void;

    protected abstract cleanup(): void;

    protected abstract createPipelines(): Promise<void>;
}


export class ParticleRenderer extends BaseWebGPURenderer {
    private inOutBuffer: InOutBuffer;
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
        private computeConfig: ComputeConfig = {
            count: 1000,
            inOutBufferStruct: null,
            workgroupSize: [64, 1, 1]
        },
        resolution?: { width: number, height: number }
    ) {
        super(canvas, shaderConfig, resolution);
    }

    async recompileShaders(
        newShaderConfig: ShaderConfig,
        options?: { computeConfig?: Partial<ComputeConfig> }
    ): Promise<void> {
        this.shaderConfig = newShaderConfig;
        if (options && options.computeConfig) {
            this.computeConfig = options.computeConfig as ComputeConfig;
        }
        this.initializeResources()
        await this.createPipelines();
    }

    async createPipelines(): Promise<void> {
        const device = this.gpuContext.Device;
        const format = this.gpuContext.Format;

        // Create shader modules
        const computeShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.computeShader,
            'Particle Update Shader'
        );

        const vertexShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.vertexShader,
            'Particle Vertex Shader'
        );

        const fragmentShaderModule = this.resourceManager.createShaderModule(
            this.shaderConfig.fragmentShader,
            'Particle Fragment Shader');

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
            vertexShaderModule,
            fragmentShaderModule,
            renderPipelineLayout
        );

        // Create pipelines
        this.computePipeline = await this.computePipelineFactory.createAsync();
        this.renderPipeline = await this.renderPipelineFactory.createAsync();
    }

    protected initializeResources(): void {
        const device = this.gpuContext.Device;


        this.inOutBuffer = new InOutBuffer(
            device,
            this.resourceManager,
            this.computeConfig
        );

        this.uniformBuffer = new UniformBuffer(device, this.resourceManager);

        // Initialize particle data
        this.writeInitialComputeData();
        this.writeUniformData();

        // Create bind group managers
        this.computeBindGroupManager = new ParticleComputeBindGroupManager(
            this.resourceManager,
            this.inOutBuffer,
            this.uniformBuffer,
            device
        );

        this.renderBindGroupManager = new ParticleRenderBindGroupManager(
            this.resourceManager,
            this.uniformBuffer,
            this.inOutBuffer,
            device
        );

    }

    protected cleanup(): void {
        this.inOutBuffer?.destroy();
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


        this.inOutBuffer.swap();
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

    private writeInitialComputeData(): void {
        if (!this.computeConfig.inOutBufferStruct) {
            throw new Error("inOutBufferStruct is null! could not find struct in shader!");
        }

        const initialData = new Float32Array(this.computeConfig.count * this.computeConfig.inOutBufferStruct.size / 4);
        for (let i = 0; i < initialData.length; i++) {
            initialData[i] = Math.random() * 2 - 1; // Random values between -1 and 1
        }

        this.inOutBuffer.writeBuffer(initialData);
    }

    private executeComputePass(encoder: GPUCommandEncoder): void {
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);

        const bindGroup = this.computeBindGroupManager.BindGroup;
        this.useFirst = !this.useFirst;
        computePass.setBindGroup(0, bindGroup);

        const [sizeX, sizeY, sizeZ] = this.computeConfig.workgroupSize;

        let workgroupCount: [number, number, number];

        // Calculate based on dimensions
        if (sizeY === 1 && sizeZ === 1) {
            // 1D dispatch
            workgroupCount = [Math.ceil(this.computeConfig.count / sizeX), 1, 1];
        } else if (sizeZ === 1) {
            // 2D dispatch
            const gridSize = Math.ceil(Math.sqrt(this.computeConfig.count));
            workgroupCount = [
                Math.ceil(gridSize / sizeX),
                Math.ceil(gridSize / sizeY),
                1
            ];
        } else {
            // 3D dispatch
            const gridSize = Math.ceil(Math.cbrt(this.computeConfig.count));
            workgroupCount = [
                Math.ceil(gridSize / sizeX),
                Math.ceil(gridSize / sizeY),
                Math.ceil(gridSize / sizeZ)
            ];
        }
        workgroupCount = validateAndClampWorkgroupCount(workgroupCount, this.computeConfig.workgroupSize);

        console.log(`Dispatching: [${workgroupCount}] with workgroup size [${this.computeConfig.workgroupSize}]`);


        computePass.dispatchWorkgroups(...workgroupCount);

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
        renderPass.draw(6, this.computeConfig.count); // 6 vertices per particle (2 triangles)
        renderPass.end();
    }
}
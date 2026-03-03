import {InputOutputBuffers, UniformBuffer} from "@/graphics/input-output-buffers.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import type {IPipelineStrategy, IRenderStrategy, IResourceStrategy, IUpdateStrategy} from "./rendering-strategies";
import {calculateWorkgroupCount} from "./workgroup-utils";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import {ComputePipelineBuilder} from "@/graphics/compute-pipeline-builder.tsx";
import {RenderPipelineBuilder} from "@/graphics/render-pipeline-builder.tsx";
import {
    createParticleComputeBindGroups,
    createParticleComputeLayout,
    createParticleRenderBindGroup,
    createParticleRenderLayout
} from "@/graphics/particle-bind-group-functions.tsx";

/**
 * Particle-specific pipeline creation strategy
 */
export class ParticlePipelineStrategy implements IPipelineStrategy {
    async createPipelines(
        device: GPUDevice,
        resourceManager: GPUResourceManager,
        shaderConfig: ShaderConfig,
        context: {
            format: GPUTextureFormat;
            computeBindGroupLayout: GPUBindGroupLayout;
            renderBindGroupLayout: GPUBindGroupLayout
        }
    ): Promise<{ compute: GPUComputePipeline; render: GPURenderPipeline }> {
        // Create shader modules
    
        
        const computeShaderModule = resourceManager.createShaderModule(
            shaderConfig.computeShader,
            'Particle Update Shader'
        );

        const vertexShaderModule = resourceManager.createShaderModule(
            shaderConfig.vertexShader,
            'Particle Vertex Shader'
        );

        const fragmentShaderModule = resourceManager.createShaderModule(
            shaderConfig.fragmentShader,
            'Particle Fragment Shader'
        );

        // Create pipeline layouts
        const computePipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [context.computeBindGroupLayout]
        });

        const renderPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [context.renderBindGroupLayout]
        });


        const compute = await new ComputePipelineBuilder(device)
            .setShaderModule(computeShaderModule)
            .setLayout(computePipelineLayout)
            .setEntryPoint('computeMain')
            .buildAsync();

        const render = await new RenderPipelineBuilder(device, context.format)
            .setVertexShaderModule(vertexShaderModule)
            .setFragmentShaderModule(fragmentShaderModule)
            .setLayout(renderPipelineLayout)
            .setVertexEntryPoint('vertexMain')
            .setFragmentEntryPoint('fragmentMain')
            .setTopology('triangle-list')
            .buildAsync();

        return {compute, render};
    }
}

/**
 * Particle-specific resource management strategy
 */
export class ParticleResourceStrategy implements IResourceStrategy {
    private inOutBuffer: InputOutputBuffers;
    private uniformBuffer: UniformBuffer;

    private renderBindGroup: GPUBindGroup;
    private computeBindGroupA: GPUBindGroup;
    private computeBindGroupB: GPUBindGroup;
    private renderLayout: GPUBindGroupLayout;
    private computeLayout: GPUBindGroupLayout;
    

    constructor(private computeConfig: ComputeConfig, private particleCount: number) {}


    initializeResources(device: GPUDevice, resourceManager: GPUResourceManager, _config: {
        resolution: { width: number; height: number }
    }): void {

        this.computeLayout = createParticleComputeLayout(device);
        this.renderLayout = createParticleRenderLayout(device);

        this.inOutBuffer = new InputOutputBuffers(
            device,
            resourceManager,
            this.computeConfig,
        );

        this.uniformBuffer = new UniformBuffer(device, resourceManager);

        // Initialize particle data
        this.writeInitialData();

        // Create bind group managers
        const [computeBindGroupA, computeBindGroupB] = createParticleComputeBindGroups(
            {
                device: device,
                uniformBuffer: this.uniformBuffer,
                particleBuffer: this.inOutBuffer,
            },
            createParticleComputeLayout(device)
        );
        this.computeBindGroupA = computeBindGroupA;
        this.computeBindGroupB = computeBindGroupB;

        this.renderLayout = createParticleRenderLayout(device);
        this.renderBindGroup = createParticleRenderBindGroup({
                device: device,
                uniformBuffer: this.uniformBuffer,
                particleBuffer: this.inOutBuffer,
            }, createParticleRenderLayout(device)
        );
        
        
    }

    cleanup(): void {
        this.inOutBuffer?.destroy();
    }

    get BindGroups(): { compute: GPUBindGroup[], render: GPUBindGroup[] } {
        return {
            compute: [this.computeBindGroupA, this.computeBindGroupB],
            render: [this.renderBindGroup]
        };
    }

    getInOutBuffer(): InputOutputBuffers {
        return this.inOutBuffer;
    }

    get UniformBuffer(): UniformBuffer {
        return this.uniformBuffer;
    }

    getComputeBindGroupLayout(): GPUBindGroupLayout {
        return this.computeLayout;
    }

    getRenderBindGroupLayout(): GPUBindGroupLayout {
        return this.renderLayout;
    }

    private writeInitialData(): void {
        if (!this.computeConfig.inOutBufferStruct) {
            throw new Error("inOutBufferStruct is null! Could not find struct in shader!");
        }

        const initialData = new Float32Array(
            this.particleCount * this.computeConfig.inOutBufferStruct.size / 4
        );
        for (let i = 0; i < initialData.length; i++) {
            initialData[i] = Math.random() * 2 - 1; // Random values between -1 and 1
        }

        this.inOutBuffer.writeBuffer(initialData);
    }
}

export class NullUpdateStrategy implements IUpdateStrategy {
    public update(): void {
    }
}

/**
 * Particle compute update strategy
 */
export class ParticleComputeUpdateStrategy implements IUpdateStrategy {
    private pingPong: PingPongBindGroups

    constructor(
        private computeConfig: ComputeConfig,
        private resourceStrategy: ParticleResourceStrategy,
        private particleCount: number
    ) {}

    update(encoder: GPUCommandEncoder, pipeline: GPUComputePipeline): void {

        if (!this.pingPong) {
            const bindGroups = this.resourceStrategy.BindGroups.compute;

            this.pingPong = new PingPongBindGroups(bindGroups as [GPUBindGroup, GPUBindGroup]);
        }
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(pipeline);
        computePass.setBindGroup(0, this.pingPong.getNext());

        const workgroupCount = calculateWorkgroupCount(
            this.particleCount,
            this.computeConfig.workgroupSize
        );

        console.log(
            `Dispatching: [${workgroupCount}] with workgroup size [${this.computeConfig.workgroupSize}]`
        );

        computePass.dispatchWorkgroups(...workgroupCount);
        computePass.end();


        // Swap buffers after compute
        this.resourceStrategy.getInOutBuffer().swap();
    }
}


/**
 * Particle render strategy
 */
export class ParticleRenderStrategy implements IRenderStrategy {
    render(
        encoder: GPUCommandEncoder,
        textureView: GPUTextureView,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        drawCount: number,
        instanceCount: number,
    ): void {
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(pipeline);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.draw(drawCount, instanceCount);
        renderPass.end();
    }
}

export class PingPongBindGroups {
    private current = 0;

    constructor(
        private readonly bindGroups: [GPUBindGroup, GPUBindGroup]
    ) {}

    /**
     * Gets current bind group and advances to next
     */
    getNext(): GPUBindGroup {
        const bindGroup = this.bindGroups[this.current];
        this.current = (this.current + 1) % 2;
        return bindGroup;
    }

    /**
     * Gets current bind group without advancing
     */
    getCurrent(): GPUBindGroup {
        return this.bindGroups[this.current];
    }

    /**
     * Resets to first bind group
     */
    reset(): void {
        this.current = 0;
    }
}
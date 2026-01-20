import computeShader from '@/shaders/compute.wgsl';
import vertexShader from '@/shaders/vertex.wgsl';
import fragmentShader from '@/shaders/fragment.wgsl';

export interface IRenderer {
    start(): void;
    stop(): void;
    destroy(): void;
}

export class WebGPURenderer implements IRenderer {
    private canvas: HTMLCanvasElement;
    private device: GPUDevice;
    private adapter: GPUAdapter | null = null;
    private format: GPUTextureFormat;
    private context: GPUCanvasContext;
    private initialized: boolean = false;
    private computePipeline: GPUComputePipeline = null;
    private renderPipeline: GPURenderPipeline = null;
    private computeShaderModule: GPUShaderModule | null = null;
    private vertexShaderModule: GPUShaderModule | null = null;
    private fragmentShaderModule: GPUShaderModule | null = null;
    private bindGroupA: GPUBindGroup | null | undefined;
    private bindGroupB: GPUBindGroup | null | undefined;
    private particleBufferA: GPUBuffer;
    private particleBufferB: GPUBuffer;
    private PARTICLE_COUNT: number = 1000;
    useBufferA: boolean;

    async init() {
        if(!navigator.gpu){
            console.error("WebGPU is not supported on this browser")
        }
        this.adapter = await navigator.gpu.requestAdapter() as GPUAdapter;
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.device = await this.adapter.requestDevice()
        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'opaque',
        })

        this.computeShaderModule = this.device.createShaderModule({
            label: 'Particle Update Shader',
            code: computeShader
        });

        this.vertexShaderModule = this.device.createShaderModule({
            label: 'Particle Vertex Shader',
            code: vertexShader
        });

        this.fragmentShaderModule = this.device.createShaderModule({
            label: 'Particle Fragment Shader',
            code: fragmentShader
        });

        this.computePipeline = this.device.createComputePipeline({
            layout: "auto",
            compute: {
                module: this.computeShaderModule,
                entryPoint: 'main'
            }
        });

        this.renderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.vertexShaderModule,
                entryPoint: 'main',
                buffers: [{
                    arrayStride: 16,
                    stepMode: 'instance',
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2'
                    }, {
                        shaderLocation: 1,
                        offset: 8,
                        format: 'float32x2'
                    }]
                }]
            },
            fragment: {
                module: this.fragmentShaderModule,
                entryPoint: 'main',
                targets: [{
                    format: this.format
                }]
            },
            primitive: {
                topology: 'point-list'
            }
        });

        this.createBuffers();
        this.createBindGroups();
        this.useBufferA = true;
    }

    private createBuffers() {
        const PARTICLE_SIZE = 16; // 4 floats * 4 bytes
        const bufferSize = this.PARTICLE_COUNT * PARTICLE_SIZE;

        this.particleBufferA = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.VERTEX,
        });

        this.particleBufferB = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC | GPUBufferUsage.VERTEX,
        });

        // Initialize particles
        const initialData = new Float32Array(this.PARTICLE_COUNT * 4);
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            initialData[i * 4] = Math.random();
            initialData[i * 4 + 1] = Math.random();
            initialData[i * 4 + 2] = (Math.random() - 0.5) * 0.01;
            initialData[i * 4 + 3] = (Math.random() - 0.5) * 0.01;
        }

        this.device.queue.writeBuffer(this.particleBufferA, 0, initialData);
    }

    createBindGroups() {
        // Bind group 1: A reads, B writes
        this.bindGroupA = this.device.createBindGroup({
            label: 'Bind Group A',
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.particleBufferA }, // Input
                },
                {
                    binding: 1,
                    resource: { buffer: this.particleBufferB }, // Output
                },
            ],
        });

        // Bind group 2: B reads, A writes (swap for next frame)
        this.bindGroupB = this.device.createBindGroup({
            label: 'Bind Group B',
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: this.particleBufferB }, // Input
                },
                {
                    binding: 1,
                    resource: { buffer: this.particleBufferA }, // Output
                },
            ],
        });
    }

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = canvasElement;
    }

    update() {
        const encoder = this.device.createCommandEncoder();

        // Compute pass
        const computePass = encoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.useBufferA ? this.bindGroupA : this.bindGroupB);

        const workgroupCount = Math.ceil(this.PARTICLE_COUNT / 64);
        computePass.dispatchWorkgroups(workgroupCount);
        computePass.end();

        // Render pass
        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(this.renderPipeline);
        const currentBuffer = this.useBufferA ? this.particleBufferB : this.particleBufferA;
        renderPass.setVertexBuffer(0, currentBuffer);
        renderPass.draw(1, this.PARTICLE_COUNT);
        renderPass.end();

        this.device.queue.submit([encoder.finish()]);

        this.useBufferA = !this.useBufferA;
    }

    animate(){
        this.update();
        requestAnimationFrame(() => this.animate());
    }

    stop(): void {
    }

    start() {
        if(!this.initialized){
            this.init().then(() => {
                this.initialized = true;
                this.animate();
            });
        }
    }

    destroy() {
    }
}
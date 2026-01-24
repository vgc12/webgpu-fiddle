export class WebGPUContext {
    private adapter: GPUAdapter | null = null;
    private device: GPUDevice | null = null;
    private context: GPUCanvasContext | null = null;
    private format: GPUTextureFormat;

    constructor(private canvas: HTMLCanvasElement) {
    }

    async initialize(): Promise<void> {
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported on this browser');
        }

        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error('Failed to request GPU adapter');
        }

        this.device = await this.adapter.requestDevice();
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'opaque'
        });
    }

    get Device(): GPUDevice {
        if (!this.device) throw new Error('Device not initialized');
        return this.device;
    }

    get Context(): GPUCanvasContext {
        if (!this.context) throw new Error('Context not initialized');
        return this.context;
    }

    get Format(): GPUTextureFormat {
        return this.format;
    }

    destroy(): void {
        this.device?.destroy();
        this.context?.unconfigure();
    }
}
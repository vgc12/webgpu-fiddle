/** Handles WebGPU initialization for a canvas, exposing the adapter, device, and context. */
export class WebGPUContext {
    private adapter: GPUAdapter | null = null;
    private device: GPUDevice | null = null;
    private context: GPUCanvasContext | null = null;
    private format: GPUTextureFormat;

    constructor(private canvas: HTMLCanvasElement) {
    }

    /** Perform the async GPU setup: adapter, device, and canvas context configuration. */
    async initialize(): Promise<void> {
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported on this browser');
        }

        // Request a GPU adapter (the physical GPU handle).
        this.adapter = await navigator.gpu.requestAdapter();
        if (!this.adapter) {
            throw new Error('Failed to request GPU adapter');
        }

        // Request a logical device from the adapter and query the preferred output format.
        this.device = await this.adapter.requestDevice();
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context = this.canvas.getContext('webgpu') as GPUCanvasContext;

        // Bind the device to the canvas so rendered frames appear on screen.
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

    /** Re-bind the device to the canvas after a drawing buffer size change. */
    reconfigure(): void {
        if (!this.context || !this.device) return;
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'opaque'
        });
    }

    /** Release the GPU device and unconfigure the canvas context. */
    destroy(): void {
        this.device?.destroy();
        this.context?.unconfigure();
    }
}
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";

// The core renderer contract. All renderers (canvas, particle) implement this interface.
// WebGPUCanvas creates a renderer and calls these methods to control the render lifecycle.
export interface IRenderer {
    // The underlying GPU device, available after start() resolves.
    readonly Device: GPUDevice | null;

    // Initialize GPU resources and begin the animation loop.
    start(): Promise<void>;

    // Pause the animation loop without destroying resources.
    stop(): void;

    // Handle canvas resize by updating viewport-dependent resources.
    resize(width: number, height: number): void;

    // Hot-reload shaders: rebuild pipelines (and optionally buffers) with new WGSL code.
    recompileShaders(newShaderConfig: ShaderConfig): Promise<void>;

    recompileShaders(newShaderConfig: ShaderConfig, options?: any): Promise<void>;

    // Tear down all GPU resources and stop the animation loop.
    destroy(): void;
}
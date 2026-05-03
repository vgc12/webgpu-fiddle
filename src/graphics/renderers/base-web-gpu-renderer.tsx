import {WebGPUContext} from "@/graphics/webgpu-context.tsx";
import {AnimationController} from "@/graphics/animation-controller.tsx";
import {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {Time} from "@/utils/time.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";


/**
 * Base WebGPU Renderer using Template Method Pattern
 * Provides the common rendering lifecycle while allowing subclasses to customize specific steps
 */
export abstract class BaseWebGPURenderer implements IRenderer {
    protected gpuContext: WebGPUContext;
    protected resourceManager: GPUResourceManager;
    protected animationController: AnimationController;
    protected time: Time;
    protected initialized: boolean = false;

    protected constructor(
        protected canvas: HTMLCanvasElement,
        protected shaderConfig: ShaderConfig,
        protected resolution: { width: number; height: number } = {width: 1920, height: 1080}
    ) {
        this.time = new Time();
        this.gpuContext = new WebGPUContext(canvas);
        this.animationController = new AnimationController();
    }

    get Device(): GPUDevice | null {
        try {
            return this.gpuContext.Device;
        }
        catch {
            return null;
        }
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

    resize(width: number, height: number): void {
        this.resolution = {width, height};
        this.gpuContext?.reconfigure();
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

    /** Replaces the current shaders and rebuilds pipelines (and optionally buffers). */
    abstract recompileShaders(newShaderConfig: ShaderConfig, options?: any): Promise<void>;

    /** Creates GPU buffers, bind groups, and other resources needed before rendering. */
    protected abstract initializeResources(): void;

    /** Per-frame callback invoked by the animation controller. */
    protected abstract update(): void;

    /** Releases GPU resources created during initializeResources(). */
    protected abstract cleanup(): void;

    /** Builds the render (and optionally compute) pipelines from the current shader config. */
    protected abstract createPipelines(): Promise<void>;
}
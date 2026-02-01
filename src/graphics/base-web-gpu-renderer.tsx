import {WebGPUContext} from "@/graphics/webgpu-context.tsx";
import {AnimationController} from "@/graphics/animation-controller.tsx";
import {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import type {shader_config} from "@/graphics/shader_config.tsx";
import {Time} from "@/utils/time.ts";

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
        canvas: HTMLCanvasElement,
        protected shaderConfig: shader_config,
        protected resolution: { width: number; height: number } = {width: 1920, height: 1080}
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

    abstract recompileShaders(newShaderConfig: shader_config, options?: any): Promise<void>;

    // Template methods - subclasses must implement
    protected abstract initializeResources(): void;

    protected abstract update(): void;

    protected abstract cleanup(): void;

    protected abstract createPipelines(): Promise<void>;
}
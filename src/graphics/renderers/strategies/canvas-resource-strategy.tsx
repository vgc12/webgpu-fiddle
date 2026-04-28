import type {IResourceStrategy, PipelineContext} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import {UniformBuffer} from "@/graphics/pipelines/input-output-buffers.tsx";
import type {GPUResourceManager} from "@/graphics/gpu-resource-manager.tsx";
import {
    createCanvasRenderBindGroup,
    createCanvasRenderLayout
} from "@/graphics/renderers/bind-groups/canvas-bind-group-functions.tsx";

// Resource strategy for canvas renderers. Creates a uniform buffer and a single
// render bind group with the uniform at binding 0. No compute resources needed.
export class CanvasResourceStrategy implements IResourceStrategy {
    private uniformBuffer: UniformBuffer;
    private renderBindGroup: GPUBindGroup;
    private renderLayout: GPUBindGroupLayout;

    cleanup(): void {
    }

    postUpdate(): void {
    }

    initializeResources(device: GPUDevice, resourceManager: GPUResourceManager, _config: {
        resolution: { width: number; height: number }
    }): void {
        this.renderLayout = createCanvasRenderLayout(device);
        this.uniformBuffer = new UniformBuffer(device, resourceManager);
        this.renderBindGroup = createCanvasRenderBindGroup({
            device,
            uniformBuffer: this.uniformBuffer
        }, this.renderLayout);
    }

    getPipelineContext(format: GPUTextureFormat): PipelineContext {
        return {
            format,
            renderBindGroupLayout: this.renderLayout,
        };
    }

    get BindGroups(): { compute: GPUBindGroup[], render: GPUBindGroup[] } {
        return {
            compute: [],
            render: [this.renderBindGroup]
        };
    }

    get UniformBuffer(): UniformBuffer {
        return this.uniformBuffer;
    }
}

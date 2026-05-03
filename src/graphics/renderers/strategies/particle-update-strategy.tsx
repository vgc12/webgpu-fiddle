import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";
import type {IResourceStrategy, IUpdateStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import {calculateWorkgroupCount} from "@/graphics/utils/workgroup-utils.tsx";
import {PingPongBindGroups} from "@/graphics/renderers/bind-groups/ping-pong-bind-groups.tsx";

/** Update strategy for particle renderers. Each frame: selects the next ping-pong bind group, dispatches the compute shader with the calculated workgroup count, then calls postUpdate() on the resource strategy to swap the input/output buffers. */
export class ParticleComputeUpdateStrategy implements IUpdateStrategy {
    private pingPong: PingPongBindGroups;

    constructor(
        private computeConfig: ComputeConfig,
        private resourceStrategy: IResourceStrategy,
        private particleCount: number
    ) {}

    /** Lazily initializes the ping-pong bind groups from the resource strategy. */
    initialize(): void {
        const bindGroups = this.resourceStrategy.BindGroups.compute;
        this.pingPong = new PingPongBindGroups(bindGroups as [GPUBindGroup, GPUBindGroup]);
    }

    /** Dispatches the compute shader for one frame, then swaps the ping-pong buffers. */
    update(encoder: GPUCommandEncoder, pipeline: GPUComputePipeline): void {
        if (!this.pingPong) {
            this.initialize();
        }

        const computePass = encoder.beginComputePass();
        computePass.setPipeline(pipeline);
        computePass.setBindGroup(0, this.pingPong.getNext());

        const workgroupCount = calculateWorkgroupCount(
            this.particleCount,
            this.computeConfig.workgroupSize
        );
        computePass.dispatchWorkgroups(...workgroupCount);
        computePass.end();

        this.resourceStrategy.postUpdate();
    }
}

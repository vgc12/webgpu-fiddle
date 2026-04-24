import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";
import type {IResourceStrategy, IUpdateStrategy} from "@/graphics/renderers/strategies/rendering-strategies.tsx";
import {calculateWorkgroupCount} from "@/graphics/utils/workgroup-utils.tsx";
import {PingPongBindGroups} from "@/graphics/renderers/bind-groups/ping-pong-bind-groups.tsx";

export class ParticleComputeUpdateStrategy implements IUpdateStrategy {
    private pingPong: PingPongBindGroups;

    constructor(
        private computeConfig: ComputeConfig,
        private resourceStrategy: IResourceStrategy,
        private particleCount: number
    ) {}

    initialize(): void {
        const bindGroups = this.resourceStrategy.BindGroups.compute;
        this.pingPong = new PingPongBindGroups(bindGroups as [GPUBindGroup, GPUBindGroup]);
    }

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

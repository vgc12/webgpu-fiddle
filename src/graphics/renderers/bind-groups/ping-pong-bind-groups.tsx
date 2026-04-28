// Alternates between two bind groups each frame for compute ping-pong.
// getNext() returns the current bind group and advances to the other,
// so each frame the compute shader reads/writes with swapped buffers.
export class PingPongBindGroups {
    private current = 0;

    constructor(
        private readonly bindGroups: [GPUBindGroup, GPUBindGroup]
    ) {
    }

    getNext(): GPUBindGroup {
        const bindGroup = this.bindGroups[this.current];
        this.current = (this.current + 1) % 2;
        return bindGroup;
    }

    getCurrent(): GPUBindGroup {
        return this.bindGroups[this.current];
    }

    reset(): void {
        this.current = 0;
    }
}

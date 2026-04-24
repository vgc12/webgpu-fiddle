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

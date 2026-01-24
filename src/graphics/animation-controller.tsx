export class AnimationController {
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;

    start(callback: () => void): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate(callback);
    }

    private animate(callback: () => void): void {
        if (!this.isRunning) return;
        callback();
        this.animationFrameId = requestAnimationFrame(() => this.animate(callback));
    }

    stop(): void {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    get IsRunning(): boolean {
        return this.isRunning;
    }
}
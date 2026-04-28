// Manages the requestAnimationFrame render loop.
// The renderer calls start() with a per-frame callback, and stop() to pause.
// Each frame, the callback is invoked and then the next frame is scheduled.
export class AnimationController {
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;

    // Begin the animation loop. The callback runs once per frame.
    start(callback: () => void): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate(callback);
    }

    // Recursive frame scheduler: runs the callback, then requests the next frame.
    private animate(callback: () => void): void {
        if (!this.isRunning) return;
        callback();
        this.animationFrameId = requestAnimationFrame(() => this.animate(callback));
    }

    // Cancel the current animation frame and stop the loop.
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
/** Manages the requestAnimationFrame render loop with start/stop control. */
export class AnimationController {
    private animationFrameId: number | null = null;
    private isRunning: boolean = false;

    /** Begin the animation loop. The callback runs once per frame. */
    start(callback: () => void): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate(callback);
    }

    /** Recursive frame scheduler: runs the callback, then requests the next frame. */
    private animate(callback: () => void): void {
        if (!this.isRunning) return;
        try {
            callback();
        } catch (e) {
            console.error('Error in animation frame:', e);
        }
        this.animationFrameId = requestAnimationFrame(() => this.animate(callback));
    }

    /** Cancel the current animation frame and stop the loop. */
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
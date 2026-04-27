export class Time {
    private lastFrameTime: number = 0;
    private deltaTime: number = 0;
    private totalTime: number = 0;
    private animationFrameId: number = 0;

    get DeltaTime(): number {
        return this.deltaTime;
    }

    get TotalTime(): number {
        return this.totalTime;
    }

    start() {

        this.reset()
        this.lastFrameTime = performance.now() / 1000;
        this.animationFrameId = requestAnimationFrame(this.update)

    }

    reset() {
        this.deltaTime = 0;
        this.lastFrameTime = performance.now() / 1000;
        this.totalTime = 0;
    }

    stop() {
        cancelAnimationFrame(this.animationFrameId);
    }

    update = () => {


        const currentTime = performance.now() / 1000;

        this.deltaTime = (currentTime - this.lastFrameTime);

        this.lastFrameTime = currentTime;

        this.totalTime += this.deltaTime;

        requestAnimationFrame(this.update)

    }

}
export class Time {
    get DeltaTime(): number {
        return this.deltaTime;
    }

    
 

    private lastFrameTime: number = 0;
    private deltaTime: number = 0;
    private totalTime: number = 0;
    private animationFrameId: number = 0;

    start() {

        this.deltaTime = 0;
        this.lastFrameTime = 0;
        this.totalTime = 0;
        this.animationFrameId = requestAnimationFrame(this.update)
        
    }

    stop() {
        cancelAnimationFrame(this.animationFrameId);
    }
    
     update = () => {

    
        const currentTime = performance.now() / 1000;

        this.deltaTime = (currentTime - this.lastFrameTime) ;

        this.lastFrameTime = currentTime;
        
        this.totalTime += this.deltaTime;
        
        requestAnimationFrame(this.update)

    }

}
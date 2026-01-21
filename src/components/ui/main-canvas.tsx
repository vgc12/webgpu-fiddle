// WebGPUCanvas.tsx - React component that owns WebGPU
import React, {useEffect, useRef} from 'react';
import {Panel} from './panel.tsx';
import {WebGPURenderer} from "@/components/graphics/webgpu-renderer.tsx";

interface WebGPUCanvasProps {
    width?: number;
    height?: number;
    children?: React.ReactNode;
}

export const WebGPUCanvas : React.FC<WebGPUCanvasProps> = ({
    width = 1920,
    height = 1080,
    children,
} )=> {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<WebGPURenderer | null>(null);

       // Initialize WebGPU once when component mounts
       useEffect(() => {
           if (!canvasRef.current) return;

           const renderer = new WebGPURenderer(canvasRef.current);
           rendererRef.current = renderer;
           renderer.start();
           // Cleanup when component unmounts
           return () => {
               renderer.destroy();
           };
       }, []); // Empty deps = run once on mount


/*
    // Update shader code when it changes
    useEffect(() => {
        if (!rendererRef.current) return;

        try {
            rendererRef.current.updateShaders(computeCode, fragmentCode, mode);
        } catch (err) {
            console.error('Shader compilation failed:', err);
        }
    }, [computeCode, fragmentCode, mode]);

    // Update particle count when it changes
    useEffect(() => {
        if (!rendererRef.current) return;
        rendererRef.current.setParticleCount(particleCount);
    }, [particleCount]);
*/
    return (
        <Panel grow={true} className={' p-2 w-[65vw] h-[90vh]'}>
            <canvas className={' rounded-md w-[100%] h-[100%]'}
                    ref={canvasRef}
                    width={width}
                    height={height}
                    id="canvas-main"
            />
            {children}
        </Panel>
    );
}
// WebGPUCanvas.tsx - React component that owns WebGPU
import React, {useEffect, useRef} from 'react';
import {Panel} from './panel.tsx';
import {WebGPURenderer} from "@/components/graphics/webgpu-renderer.tsx";
import graphicsShader from "@/shaders/graphics.wgsl";
import computeShader from "@/shaders/compute.wgsl";
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
           if (!canvasRef.current || rendererRef.current) return;

           const renderer = new WebGPURenderer(canvasRef.current, {
               computeShader: computeShader, graphicsShader: graphicsShader
           },
               {
                   count: 2000,
                   particleStructSize: 16,
                   workgroupSize: 64,
                   initialVelocityRange: 0.02
               });
           rendererRef.current = renderer;
           renderer.start().catch(err => {
               console.error('Failed to start WebGPU renderer:', err);
           });
           
           return () => {
               renderer.destroy();
           };
       }, []); // Empty deps = run once on mount
    
    return (
        <Panel grow={true} className={'w-[66vw] h-[90vh]'}>
            <canvas className={'rounded-md w-[100%] h-[100%]'}
                    ref={canvasRef}
                    width={width}
                    height={height}
                    id="canvas-main"
            />
            {children}
        </Panel>
    );
}
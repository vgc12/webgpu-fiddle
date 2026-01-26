// WebGPUCanvas.tsx - React component that owns WebGPU
import React, {useEffect, useRef} from 'react';
import {ParticleRenderer} from "@/graphics/webgpu-renderer.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";

interface WebGPUCanvasProps {
    width?: number;
    height?: number;
    rendererRef?: React.RefObject<IRenderer | null>;
    computeShader?: string;
    graphicsShader?: string;
    children?: React.ReactNode;
}

export const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({
                                                              width = 1920,
                                                              height = 1080,
                                                              rendererRef,
                                                              computeShader = '',
                                                              graphicsShader = '',
                                                          }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);


    // Initialize WebGPU once when component mounts
    useEffect(() => {
        if (!canvasRef.current || !rendererRef || rendererRef.current) {
            return;
        }

        const renderer = new ParticleRenderer(canvasRef.current, {
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

        <canvas className={'rounded-md w-[100%] h-[100%]'}
                ref={canvasRef}
                width={width}
                height={height}
                id="canvas-main"
        />


    );
}
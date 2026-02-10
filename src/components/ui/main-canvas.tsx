// WebGPUCanvas.tsx - React component that owns WebGPU
import React, {useEffect, useRef} from 'react';
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {CanvasRenderer} from "@/graphics/canvas-renderer.tsx";

interface WebGPUCanvasProps {
    width?: number;
    height?: number;
    rendererRef?: React.RefObject<IRenderer | null>;
    computeShader?: string;
    vertexShader?: string;
    fragmentShader?: string;
    children?: React.ReactNode;
}

export const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({
                                                              width = 1920,
                                                              height = 1080,
                                                              rendererRef,
                                                              computeShader = '',
                                                              vertexShader = '',
                                                              fragmentShader = '',
                                                          }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);


    // Initialize WebGPU once when component mounts
    useEffect(() => {
        if (!canvasRef.current || !rendererRef || rendererRef.current) {
            return;
        }
        /*
        const renderer = new ParticleRenderer(canvasRef.current, {
                computeShader: computeShader, vertexShader: vertexShader, fragmentShader: fragmentShader,
            },
            {
                count: 2000,
                inOutBufferStruct: getStructFromBufferBinding(computeShader, 'input'),
                workgroupSize: [64, 1, 1],
            });
            
         */
        const renderer = new CanvasRenderer(canvasRef.current, {
            computeShader: computeShader,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
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
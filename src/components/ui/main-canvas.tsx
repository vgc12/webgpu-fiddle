import React, {useEffect, useRef} from 'react';
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {CanvasRenderer} from "@/graphics/canvas-renderer.tsx";
import {ParticleRenderer} from "@/graphics/particle-renderer.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";

interface WebGPUCanvasProps {
    rendererRef?: React.RefObject<IRenderer | null>;
    computeShader?: string;
    vertexShader?: string;
    shaderType?: 'canvas' | 'particle';
    fragmentShader?: string;
    computeConfig?: ComputeConfig | null;
}

export const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({
                                                              rendererRef,
                                                              computeShader = '',
                                                              vertexShader = '',
                                                              fragmentShader = '',
                                                              shaderType = null,
                                                              computeConfig = null
                                                          }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize WebGPU once when component mounts
    useEffect(() => {
        if (!canvasRef.current || !rendererRef || rendererRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;


        let renderer: IRenderer | undefined;

        switch (shaderType) {
            case 'canvas':
                renderer = new
                CanvasRenderer(canvas, {
                    computeShader: computeShader,
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader
                }, {width: canvas.width, height: canvas.height});
                break;
            case 'particle':
                if (computeConfig) {
                    renderer = new ParticleRenderer(canvas, {
                        computeShader: computeShader,
                        vertexShader: vertexShader,
                        fragmentShader: fragmentShader,

                    }, computeConfig, {width: canvas.width, height: canvas.height});
                }
                break;
            default:
                renderer = new CanvasRenderer(canvas, {
                    computeShader: computeShader,
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader
                }, {width: canvas.width, height: canvas.height});
        }

        if (renderer === undefined) {
            console.error('Failed to create renderer: Invalid shader type or missing compute config');
            return;
        }

        rendererRef.current = renderer;
        renderer.start().catch(err => {
            console.error('Failed to start WebGPU renderer:', err);
        });

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const {width, height} = entry.contentRect;
                const pixelWidth = Math.round(width * dpr);
                const pixelHeight = Math.round(height * dpr);
                canvas.width = pixelWidth;
                canvas.height = pixelHeight;
                renderer.resize(pixelWidth, pixelHeight);
            }
        });
        observer.observe(canvas);

        return () => {
            observer.disconnect();
            renderer.destroy();
        };
    }, []);

    return (
        <canvas className={'rounded-md w-full h-full'}
                ref={canvasRef}
                id="canvas-main"
        />
    );
}
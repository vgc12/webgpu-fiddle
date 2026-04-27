import React, {useCallback, useEffect, useRef} from 'react';
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {CanvasRenderer} from "@/graphics/renderers/canvas-renderer.tsx";
import {ParticleRenderer} from "@/graphics/renderers/particle-renderer.tsx";
import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";
import type {render_settings} from "@/types.tsx";

interface Shaders {
    computeShader: string;
    vertexShader: string;
    fragmentShader: string;
    backgroundShader?: string;
}

interface WebGPUCanvasProps {
    rendererRef?: React.RefObject<IRenderer | null>;
    computeShader?: string;
    vertexShader?: string;
    shaderType?: 'canvas' | 'particle';
    fragmentShader?: string;
    backgroundShader?: string;
    computeConfig?: ComputeConfig | null;
    renderSettings: render_settings;
}

function createRenderer(
    canvas: HTMLCanvasElement,
    shaders: Shaders,
    renderSettings: render_settings,
    shaderType: 'canvas' | 'particle',
    computeConfig: ComputeConfig | null,
    size: { width: number; height: number },
): IRenderer | null {
    if (shaderType === 'particle') {
        if (!computeConfig) {
            console.error('Particle renderer requires a compute config');
            return null;
        }
        return new ParticleRenderer(canvas, shaders, renderSettings, computeConfig, size);
    }
    return new CanvasRenderer(canvas, shaders, renderSettings, size);
}

function useCanvasResize(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    onResize: (width: number, height: number) => void,
) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const dpr = window.devicePixelRatio || 1;
            for (const entry of entries) {
                const {width, height} = entry.contentRect;
                const pw = Math.round(width * dpr);
                const ph = Math.round(height * dpr);
                canvas.width = pw;
                canvas.height = ph;
                onResize(pw, ph);
            }
        });

        observer.observe(canvas);
        return () => observer.disconnect();
    }, [canvasRef, onResize]);
}

export const WebGPUCanvas: React.FC<WebGPUCanvasProps> = ({
                                                              rendererRef,
                                                              computeShader = '',
                                                              vertexShader = '',
                                                              fragmentShader = '',
                                                              backgroundShader,
                                                              shaderType = 'canvas',
                                                              computeConfig = null,
                                                              renderSettings,
                                                          }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const initializedRef = useRef(false);




    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !rendererRef || initializedRef.current) {
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const shaders: Shaders = {computeShader, vertexShader, fragmentShader, backgroundShader};
        const size = {width: canvas.width, height: canvas.height};

        const renderer = createRenderer(canvas, shaders, renderSettings, shaderType, computeConfig, size);
        if (!renderer) {
            return;
        }

        rendererRef.current = renderer;
        initializedRef.current = true;

        renderer.start().catch((err) => {
            console.error('Failed to start WebGPU renderer:', err);
        });

        return () => {
            renderer.destroy();
            rendererRef.current = null;
            initializedRef.current = false;
        };

    }, []);

    const handleResize = useCallback((width: number, height: number) => {
        rendererRef?.current?.resize(width, height);
    }, [rendererRef]);

    useCanvasResize(canvasRef, handleResize);

    return (
        <canvas
            className="rounded-md w-full h-full"
            ref={canvasRef}
            id="canvas-main"
  
        />
    );
};
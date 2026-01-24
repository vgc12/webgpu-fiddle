import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/utils.ts";

interface SplitPanelProps {
    children: [React.ReactNode, React.ReactNode];
    direction?: 'horizontal' | 'vertical';
    defaultSplit?: number; // percentage (0-100)
    minSize?: number; // pixels
    className?: string;
}

export const SplitPanel: React.FC<SplitPanelProps> = ({
                                                          children,
                                                          direction = 'vertical',
                                                          defaultSplit = 50,
                                                          minSize = 100,
                                                          className
                                                      }) => {
    const [split, setSplit] = useState(defaultSplit);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            let newSplit: number;

            if (direction === 'horizontal') {
                const mousePos = e.clientX - rect.left;
                newSplit = (mousePos / rect.width) * 100;
            } else {
                const mousePos = e.clientY - rect.top;
                newSplit = (mousePos / rect.height) * 100;
            }

            // Apply constraints based on minSize
            const minPercent = (minSize / (direction === 'horizontal' ? rect.width : rect.height)) * 100;
            const maxPercent = 100 - minPercent;

            newSplit = Math.max(minPercent, Math.min(maxPercent, newSplit));
            setSplit(newSplit);
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [direction, minSize]);

    const isHorizontal = direction === 'horizontal';

    return (
        <div
            ref={containerRef}
            className={cn('flex gap-4', isHorizontal ? 'flex-row' : 'flex-col', className)}
        >
            <div style={{ [isHorizontal ? 'width' : 'height']: `${split}%` }}>
                {children[0]}
            </div>

            <div
                onMouseDown={handleMouseDown}
                className={cn(
                    'group relative z-10',
                    isHorizontal
                        ? 'w-1 cursor-col-resize hover:w-2 -mx-2'
                        : 'h-1 cursor-row-resize hover:h-2 -my-2',
                    'bg-transparent hover:bg-blue-500/20 transition-all'
                )}
            >
                <div className={cn(
                    'absolute bg-gray-400 dark:bg-gray-600 rounded-full group-hover:bg-blue-500 transition-colors',
                    isHorizontal
                        ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12'
                        : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1'
                )} />
            </div>

            <div style={{ [isHorizontal ? 'width' : 'height']: `${100 - split}%` }}>
                {children[1]}
            </div>
        </div>
    );
};
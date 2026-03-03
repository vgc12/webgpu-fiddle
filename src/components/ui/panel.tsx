import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/utils.ts";

interface PanelProps {
    children?: React.ReactNode
    className?: string
    label?: string
    grow?: boolean
    resizable?: boolean
    resizeDirection?: 'horizontal' | 'vertical' // NEW: control resize direction
    defaultSize?: number // percentage or pixels
    minSize?: number
    maxSize?: number
    onResize?: (size: number) => void
}

export const Panel: React.FC<PanelProps> = ({
                                                children,
                                                className,
                                                label,
                                                grow,
                                                resizable = false,
                                                resizeDirection = 'vertical', 
                                                defaultSize,
                                                minSize = 100,
                                                maxSize,
                                                onResize
                                            }) => {
    const [size, setSize] = useState(defaultSize);
    const panelRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const isHorizontal = resizeDirection === 'horizontal';

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !panelRef.current) return;

            const panel = panelRef.current;
            const rect = panel.getBoundingClientRect();

            // Calculate new size based on direction
            const newSize = isHorizontal
                ? e.clientX - rect.left  // Width for horizontal
                : e.clientY - rect.top;  // Height for vertical

            // Apply constraints
            const constrainedSize = Math.max(
                minSize,
                maxSize ? Math.min(newSize, maxSize) : newSize
            );

            setSize(constrainedSize);
            onResize?.(constrainedSize);
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
    }, [minSize, maxSize, onResize, isHorizontal]);

    // Set width or height based on direction
    const style: React.CSSProperties = size
        ? isHorizontal
            ? { width: `${size}px` }
            : { height: `${size}px` }
        : {};

    return (
        <div
            ref={panelRef}
            style={style}
            className={cn(
                'w-100 flex flex-col dark:text-white text-black dark:bg-gray-800 bg-gray-100 rounded-2xl p-6 shadow-[0_0_15px_-5px_rgba(0,0,0,0.1)] shadow-gray-800 relative',
                className,
                grow && !size && 'grow'
            )}
        >
            {label && (
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {label}
                </h3>
            )}
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
            {resizable && (
                <div
                    onMouseDown={handleMouseDown}
                    className={cn(
                        'absolute group transition-colors',
                        isHorizontal
                            ? 'right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/20'
                            : 'bottom-0 left-0 right-0 h-2 cursor-row-resize hover:bg-blue-500/20'
                    )}
                >
                    <div className={cn(
                        'absolute bg-gray-400 dark:bg-gray-600 rounded-full group-hover:bg-blue-500 transition-colors',
                        isHorizontal
                            ? 'right-0 top-1/2 -translate-y-1/2 w-1 h-12'
                            : 'bottom-0 left-1/2 -translate-x-1/2 w-12 h-1'
                    )} />
                </div>
            )}
        </div>
    );
};
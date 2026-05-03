// AI used for applying tailwind styles and html in this file
import React, {useEffect, useRef, useState} from "react";
import {cn} from "@/utils/utils.tsx";

export function SplitPane({children, className, defaultSplit = 60}: {
    children: [React.ReactNode, React.ReactNode];
    className?: string;
    defaultSplit?: number;
}) {
    const [splitPercent, setSplitPercent] = useState(defaultSplit);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setSplitPercent(Math.max(20, Math.min(80, pct)));
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
    }, []);

    return (
        <div ref={containerRef} className={cn('flex flex-row ', className)}>
            <div style={{width: `${splitPercent}%`}} className="min-w-0 overflow-hidden rounded-lg">
                {children[0]}
            </div>
            <div
                onMouseDown={(e) => {
                    e.preventDefault();
                    isDragging.current = true;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                }}
                className="w-1.5 shrink-0 cursor-col-resize group hover:bg-blue-500/30 transition-colors relative"
            >
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-10 bg-gray-400 dark:bg-gray-600 rounded-full group-hover:bg-blue-500 transition-colors"/>
            </div>
            <div style={{width: `${100 - splitPercent}%`}} className="min-w-0 overflow-hidden rounded-lg">
                {children[1]}
            </div>
        </div>
    );
}

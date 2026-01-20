import React from "react";
import {cn} from "@/utils.ts";

interface PanelProps {
    children?: React.ReactNode
    className?: string
    maxHeight?: number
    label?: string
    grow?: boolean
    flex?: string

}

export const Panel: React.FC<PanelProps> = ({children, className, label, grow}) =>
{
    return (
        <div
            className={cn('transition-all transition-discrete duration-500 w-100 flex flex-col dark:text-white text-black dark:bg-gray-800 bg-gray-100 rounded-2xl p-6 shadow-[0_0_15px_-5px_rgba(0,0,0,0.1)] shadow-gray-800', className, grow && 'grow')}>
            {label && <h3 className=" text-lg font-semibold mb-4 flex items-center gap-2">
                {label}
            </h3>}
            {children}
        </div>
    )
}
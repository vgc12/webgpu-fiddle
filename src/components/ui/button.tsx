import React, {type ComponentProps} from "react";
import {cn} from "@/utils/utils.tsx";

export const ButtonLightRectangle: React.FC<ComponentProps<'button'>> = (props) => {
    return (
        <button
            {...props}
            className={cn('bg-white border border-gray-300 focus:outline-none hover:bg-gray-100' +
                ' font-medium rounded-md text-xs px-3 py-1.5 dark:bg-gray-800' +
                ' dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600' +
                ' transition-colors', props.className)}
        >
            {props.children}
        </button>
    );
}
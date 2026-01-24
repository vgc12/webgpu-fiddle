import React, {type ComponentProps} from "react";
import {cn} from "@/utils/utils.ts";
import {Drawer as DrawerPrimitive} from "vaul";


export const ButtonLightSquare: React.FC<ComponentProps<'button'>> = (props) =>
{
    return (<button {...props}
                    className={cn(props.className, 'bg-white border border-gray-300 focus:outline-none hover:bg-gray-100' +
                        ' focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm p-4 m-2 dark:bg-gray-800' +
                        ' dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600' +
                        ' dark:focus:ring-gray-700')}></button>)
}

export const ButtonLightRectangle: React.FC<ComponentProps<'button'>> = (props) =>
{

    return (<button {...props} className={cn('bg-white border-2 border-gray-300 focus:outline-none hover:bg-gray-100' +
        ' focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 m-2 dark:bg-gray-800' +
        '  dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600' +
        ' dark:focus:ring-gray-700 ', props.className)}></button>)
}

export const TriggerLightRectangle = ({
                                          ...props
                                      }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) =>
    <DrawerPrimitive.Trigger {...props}
                             className={cn(props.className, 'bg-white border-2 border-gray-300 focus:outline-none hover:bg-gray-100' +
                                 ' focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 m-2 dark:bg-gray-800' +
                                 '  dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600' +
                                 ' dark:focus:ring-gray-700 ')} data-slot="drawer-trigger"/>;

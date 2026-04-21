import React from "react";

export function Popup({title, children}: { title: string; children?: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-xl min-w-[300px]">
                <h2 className="text-lg font-semibold mb-4">{title}</h2>
                <div className="flex flex-col gap-3">
                    {children}
                </div>
            </div>
        </div>
    );
}

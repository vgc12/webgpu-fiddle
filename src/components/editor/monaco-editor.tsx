// Tabbed Monaco editor component with WGSL support, shader diagnostics,
// and a Ctrl+Enter compile keybinding. All editor lifecycle logic lives
// in the useMonacoEditor hook; this file handles rendering only.

import {cn} from '@/utils/utils';
import type {shader_diagnostic} from '@/graphics/shaders/shader-validator.tsx';
import {useMonacoEditor} from '@/components/editor/use-monaco-editor';

export interface Tab {
    id: string;
    label: string;
}

interface MonacoEditorProps {
    value: string;
    language: string;
    onChange?: (value: string) => void;
    onCompile?: () => void;
    diagnostics?: shader_diagnostic[];
    height?: string;
    className?: string;
    tabs?: Tab[];
    activeTabId?: string;
    onTabChange?: (tabId: string) => void;
    darkMode?: boolean;
}

export function MonacoEditor({
                                 value,
                                 language,
                                 onChange,
                                 onCompile,
                                 diagnostics,
                                 className,
                                 tabs,
                                 activeTabId,
                                 onTabChange,
                                 darkMode = true
                             }: MonacoEditorProps) {
    const editorRef = useMonacoEditor({value, language, darkMode, onChange, onCompile, diagnostics});

    if (!tabs || tabs.length === 0) {
        return <div ref={editorRef} className={className}/>;
    }

    return (
        <div className={cn('flex flex-col h-full', className)}>
            <div className="flex gap-0 bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange?.(tab.id)}
                        className={cn(
                            'px-4 py-2 text-xs font-medium transition-colors border-b-2',
                            tab.id === activeTabId
                                ? 'text-black dark:text-white border-blue-500 bg-gray-200 dark:bg-gray-800'
                                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                        )}>
                        {tab.label}
                    </button>
                ))}
            </div>
            <div ref={editorRef} className="flex-1"/>
        </div>
    );
}

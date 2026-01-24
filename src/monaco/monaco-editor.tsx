import {useEffect, useRef, useState} from 'react';
import * as monaco from 'monaco-editor';
import {cn} from '@/utils/utils';

export interface Tab {
    id: string;
    label: string;
}

interface MonacoEditorProps {
    value: string;
    language: string;
    onChange?: (value: string) => void;
    height?: string;
    className?: string;
    tabs?: Tab[];
    activeTabId?: string;
    onTabChange?: (tabId: string) => void;
}

export function MonacoEditor({
                                 value,
                                 language,
                                 onChange,
                                 className,
                                 tabs,
                                 activeTabId,
                                 onTabChange
                             }: MonacoEditorProps) {
    const [activeTab, setActiveTab] = useState(activeTabId || tabs?.[0]?.id);
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (editorRef.current) {
            // Create editor
            monacoRef.current = monaco.editor.create(editorRef.current, {
                value,
                language,
                theme: 'vs-dark',
                lineNumbers: "on",
                automaticLayout: true,
                minimap: {enabled: true},
                scrollBeyondLastLine: false,
                fontSize: 14,
            });

            // Listen for changes
            const disposable = monacoRef.current.onDidChangeModelContent(() => {
                onChange?.(monacoRef.current!.getValue());
            });

            // Cleanup
            return () => {
                disposable.dispose();
                monacoRef.current?.dispose();
            };
        }
    }, []);

    // Update value when prop changes
    useEffect(() => {
        if (monacoRef.current && monacoRef.current.getValue() !== value) {
            monacoRef.current.setValue(value);
        }
    }, [value]);

    // Update language when prop changes
    useEffect(() => {
        if (monacoRef.current) {
            const model = monacoRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        onTabChange?.(tabId);
    };

    // If no tabs, render just the editor
    if (!tabs || tabs.length === 0) {
        return <div ref={editorRef} className={className}/>;
    }

    // With tabs
    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Tab Bar */}
            <div className="flex gap-1 bg-gray-900 border-b border-gray-700 px-2 pt-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            'px-4 py-2 rounded-t-lg text-sm font-medium transition-colors',
                            activeTab === tab.id
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800/50'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div ref={editorRef} className="flex-1"/>
        </div>
    );
}
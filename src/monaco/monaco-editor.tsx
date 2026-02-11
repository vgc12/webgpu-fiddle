import {useEffect, useRef} from 'react';
import * as monaco from 'monaco-editor';
import {cn} from '@/utils/utils';
import {ButtonLightRectangle} from "@/components/ui/button.tsx";

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco Editor workers
self.MonacoEnvironment = {
    getWorker(_: string, label: string) {
        switch (label) {
            case 'json':
                return new jsonWorker();
            case 'css':
            case 'scss':
            case 'less':
                return new cssWorker();
            case 'html':
            case 'handlebars':
            case 'razor':
                return new htmlWorker();
            case 'typescript':
            case 'javascript':
                return new tsWorker();
            default:
                return new editorWorker();
        }
    }
};

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
    onTabChange?: (tabId: string) => void;
}

export function MonacoEditor({
                                 value,
                                 language,
                                 onChange,
                                 className,
                                 tabs,
                                 onTabChange
                             }: MonacoEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const isUpdatingFromProp = useRef(false);
    const disposableRef = useRef<monaco.IDisposable | null>(null);

    useEffect(() => {
        if (editorRef.current && !monacoRef.current) {
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

            disposableRef.current = monacoRef.current.onDidChangeModelContent(() => {
                if (!isUpdatingFromProp.current && monacoRef.current) {
                    onChange?.(monacoRef.current.getValue());
                }
            });
        }

        return () => {
            if (disposableRef.current) {
                try {
                    disposableRef.current.dispose();
                }
                catch (e) {
                    // Ignore cancellation errors during cleanup
                }
                disposableRef.current = null;
            }

            if (monacoRef.current) {
                try {
                    if (monacoRef && monacoRef.current) {
                        monacoRef.current.dispose();
                    }
                }
                catch (e) {
                    // Ignore cancellation errors during cleanup
                }
                monacoRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (monacoRef.current && monacoRef.current.getValue() !== value) {
            isUpdatingFromProp.current = true;
            monacoRef.current.setValue(value);
            setTimeout(() => {
                isUpdatingFromProp.current = false;
            }, 0);
        }
    }, [value]);

    useEffect(() => {
        if (monacoRef.current) {
            const model = monacoRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    const handleTabClick = (tabId: string) => {
        onTabChange?.(tabId);
    };

    if (!tabs || tabs.length === 0) {
        return <div ref={editorRef} className={className}/>;
    }

    return (
        <div className={cn('flex flex-col h-full', className)}>
            <div className="flex gap-1 bg-gray-900 border-b border-gray-700 px-2 pt-2">
                {tabs.map(tab => (
                    <ButtonLightRectangle
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn()}
                    >
                        {tab.label}
                    </ButtonLightRectangle>
                ))}
            </div>
            <div ref={editorRef} className="flex-1"/>
        </div>
    );
}
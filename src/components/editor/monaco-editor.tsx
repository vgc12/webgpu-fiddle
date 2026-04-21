import {useEffect, useRef} from 'react';
import * as monaco from 'monaco-editor';
import {cn} from '@/utils/utils';
import type {shader_diagnostic} from '@/graphics/shaders/shader-validator.tsx';

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';


// Configure Monaco Editor workers
(self as any).MonacoEnvironment = {
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
    onCompile?: () => void;
    diagnostics?: shader_diagnostic[];
    height?: string;
    className?: string;
    tabs?: Tab[];
    activeTabId?: string;
    onTabChange?: (tabId: string) => void;
    darkMode?: boolean;
}

const SEVERITY_MAP: Record<string, monaco.MarkerSeverity> = {
    error: monaco.MarkerSeverity.Error,
    warning: monaco.MarkerSeverity.Warning,
    info: monaco.MarkerSeverity.Info,
};

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
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const isUpdatingFromProp = useRef(false);
    const onCompileRef = useRef(onCompile);
    onCompileRef.current = onCompile;

    useEffect(() => {
        if (editorRef.current && !monacoRef.current) {
            monacoRef.current = monaco.editor.create(editorRef.current, {
                value,
                language,
                theme: darkMode ? 'vs-dark' : 'vs',
                lineNumbers: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding : { bottom: 14*20},
                fontSize: 14,
                tabSize: 4,
                bracketPairColorization: {enabled: true},
                guides: {bracketPairs: true},
                renderWhitespace: 'selection',
            });

            monacoRef.current.onDidChangeModelContent(() => {
                if (!isUpdatingFromProp.current && monacoRef.current) {
                    onChange?.(monacoRef.current.getValue());
                }
            });

            monacoRef.current.addAction({
                id: 'compile-shaders',
                label: 'Compile & Apply Shaders',
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                run: () => onCompileRef.current?.(),
            });
        }

        return () => {
            if (monacoRef.current) {
                try {
                    monacoRef.current.dispose();
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

    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.updateOptions({theme: darkMode ? 'vs-dark' : 'vs'});
            monaco.editor.setTheme(darkMode ? 'vs-dark' : 'vs');
        }
    }, [darkMode]);

    useEffect(() => {
        const editorModel = monacoRef.current?.getModel();
        if (!editorModel) {
            return;
        }

        if (!diagnostics || diagnostics.length === 0) {
            monaco.editor.setModelMarkers(editorModel, 'wgsl', []);
            return;
        }

        const markers: monaco.editor.IMarkerData[] = diagnostics.map(d => {
            const lineLength = editorModel.getLineLength(d.line) ?? 0;
            const endCol = d.length > 0
                           ? d.column + d.length
                           : lineLength + 1;

            return {
                severity: SEVERITY_MAP[d.severity] ?? monaco.MarkerSeverity.Error,
                message: d.message,
                startLineNumber: d.line,
                startColumn: d.column,
                endLineNumber: d.line,
                endColumn: endCol,
            };
        });

        monaco.editor.setModelMarkers(editorModel, 'wgsl', markers);
    }, [diagnostics]);

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
// Custom hook that manages the Monaco editor lifecycle:
// creation, value synchronization, language/theme switching,
// and the Ctrl+Enter compile keybinding.

import {useEffect, useRef} from 'react';
import * as monaco from 'monaco-editor';
import type {shader_diagnostic} from '@/graphics/shaders/shader-validator.tsx';
import {useEditorDiagnostics} from '@/components/editor/use-editor-diagnostics';

interface UseMonacoEditorOptions {
    value: string;
    language: string;
    darkMode: boolean;
    onChange?: (value: string) => void;
    onCompile?: () => void;
    diagnostics?: shader_diagnostic[];
}

export function useMonacoEditor(options: UseMonacoEditorOptions) {
    const {value, language, darkMode, onChange, onCompile, diagnostics} = options;

    const editorRef = useRef<HTMLDivElement>(null);
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const isUpdatingFromProp = useRef(false);

    // Keep a stable ref to onCompile so the keybinding always calls the latest version.
    const onCompileRef = useRef(onCompile);
    onCompileRef.current = onCompile;

    // Create the editor instance on mount, dispose on unmount.
    useEffect(() => {
        if (editorRef.current && !monacoRef.current) {
            monacoRef.current = monaco.editor.create(editorRef.current, {
                value,
                language,
                theme: darkMode ? 'vs-dark' : 'vs',
                lineNumbers: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: {bottom: 14 * 20},
                fontSize: 14,
                tabSize: 4,
                bracketPairColorization: {enabled: true},
                guides: {bracketPairs: true},
                renderWhitespace: 'selection',
            });

            // Forward content changes to the parent (unless we're updating from a prop).
            monacoRef.current.onDidChangeModelContent(() => {
                if (!isUpdatingFromProp.current && monacoRef.current) {
                    onChange?.(monacoRef.current.getValue());
                }
            });

            // Ctrl+Enter / Cmd+Enter triggers shader compilation.
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
                } catch {
                    // Ignore cancellation errors during cleanup
                }
                monacoRef.current = null;
            }
        };
    }, []);

    // Sync external value changes into the editor (e.g. tab switch).
    useEffect(() => {
        if (monacoRef.current && monacoRef.current.getValue() !== value) {
            isUpdatingFromProp.current = true;
            monacoRef.current.setValue(value);
            setTimeout(() => {
                isUpdatingFromProp.current = false;
            }, 0);
        }
    }, [value]);

    // Update the model language when the prop changes.
    useEffect(() => {
        if (monacoRef.current) {
            const model = monacoRef.current.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }, [language]);

    // Switch between light and dark themes.
    useEffect(() => {
        if (monacoRef.current) {
            monacoRef.current.updateOptions({theme: darkMode ? 'vs-dark' : 'vs'});
            monaco.editor.setTheme(darkMode ? 'vs-dark' : 'vs');
        }
    }, [darkMode]);

    // Delegate diagnostic marker management to a separate hook.
    useEditorDiagnostics(monacoRef, diagnostics);

    return editorRef;
}

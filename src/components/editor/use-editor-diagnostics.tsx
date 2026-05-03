// Hook that maps shader_diagnostic[] to Monaco editor markers (error squiggles).
// Clears markers when diagnostics are empty, otherwise converts each diagnostic
// to a Monaco IMarkerData with the correct line/column span and severity.

import {useEffect, type RefObject} from 'react';
import * as monaco from 'monaco-editor';
import type {shader_diagnostic} from '@/graphics/shaders/shader-validator.tsx';

const SEVERITY_MAP: Record<string, monaco.MarkerSeverity> = {
    error: monaco.MarkerSeverity.Error,
    warning: monaco.MarkerSeverity.Warning,
    info: monaco.MarkerSeverity.Info,
};

export function useEditorDiagnostics(
    editorRef: RefObject<monaco.editor.IStandaloneCodeEditor | null>,
    diagnostics?: shader_diagnostic[]
) {
    useEffect(() => {
        const editorModel = editorRef.current?.getModel();
        if (!editorModel) return;

        if (!diagnostics || diagnostics.length === 0) {
            monaco.editor.setModelMarkers(editorModel, 'wgsl', []);
            return;
        }

        const markers: monaco.editor.IMarkerData[] = diagnostics.map(d => {
            const lineLength = editorModel.getLineLength(d.line) ?? 0;
            const endCol = d.length > 0 ? d.column + d.length : lineLength + 1;

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
}

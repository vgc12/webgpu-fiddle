import '../style.css'
import {useEffect, useState} from "react";
import {useDarkMode} from "@/hooks/use-dark-mode.tsx";
import {ShaderWorkspace} from "@/components/shader-workspace.tsx";
import {TemplateSelector} from "@/components/template-selector.tsx";
import {RenderSettings} from "@/components/render-settings.tsx";
import type {template_def, render_settings, tab_id} from "@/types.tsx";
import {TEMPLATES} from "@/templates.tsx";
import {clearShareHash, decodeShareUrl, fromSparse} from "@/utils/shader-url-codec.tsx";

function App() {
    const [sharedState] = useState(() => {
        const shared = decodeShareUrl();
        if (!shared) return null;
        const template = TEMPLATES.find(t => t.name === shared.template);
        if (!template) return null;
        return {
            template,
            renderSettings: {
                vertexDrawCount: shared.renderSettings.vertexDrawCount,
                instanceCount: shared.renderSettings.instanceCount,
                initialData: shared.renderSettings.sparseData
                    ? fromSparse(shared.renderSettings.sparseData)
                    : null,
            },
            shaders: shared.shaders,
        };
    });

    useEffect(() => {
        if (sharedState) clearShareHash();
    }, [sharedState]);

    const [isDarkMode, setIsDarkMode] = useDarkMode() as [boolean, (v: boolean) => void];

    const [selectedTemplate, setSelectedTemplate] = useState<template_def | null>(sharedState?.template ?? null);
    const [renderSettings, setRenderSettings] = useState<render_settings>(
        sharedState?.renderSettings ?? {
            vertexDrawCount: 6,
            instanceCount: 1,
            initialData: null,
        }
    );
    const [initialShaders, setInitialShaders] = useState<Record<tab_id, string> | null>(sharedState?.shaders ?? null);
    const [workspaceKey, setWorkspaceKey] = useState(0);
    const [templateSelectorOpen, setTemplateSelectorOpen] = useState<boolean>(false);
    const [renderSettingsOpen, setRenderSettingsOpen] = useState<boolean>(false);

    if (selectedTemplate === null || templateSelectorOpen) {
        return <TemplateSelector onConfirm={(template) => {
            setSelectedTemplate(template);
            setRenderSettings(template.defaultRenderSettings);
            setInitialShaders(null);
            setWorkspaceKey(k => k + 1);
            setTemplateSelectorOpen(false);
        }}/>;
    } else if (renderSettingsOpen) {
        return (
            <RenderSettings
                renderSettings={renderSettings}
                onConfirm={(settings) => {
                    setRenderSettings(settings);
                    setRenderSettingsOpen(false);
                }}
            />
        );
    }

    return (
        <ShaderWorkspace
            key={workspaceKey}
            templateName={selectedTemplate.name}
            shaderType={selectedTemplate.shaderType}
            shaderConfig={selectedTemplate.shaderConfig}
            renderSettings={renderSettings}
            initialUserShaders={initialShaders}
            onChangeTemplate={() => setTemplateSelectorOpen(true)}
            onChangeRenderSettings={() => setRenderSettingsOpen(true)}
            onSwitchTemplate={(template, shaders) => {
                setSelectedTemplate(template);
                setRenderSettings(template.defaultRenderSettings);
                setInitialShaders(shaders as Record<tab_id, string>);
                setWorkspaceKey(k => k + 1);
            }}
            darkMode={{isDarkMode, setIsDarkMode}}
        />
    );
}

export default App

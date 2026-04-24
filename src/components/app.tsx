import '../style.css'
import {useState} from "react";
import {useDarkMode} from "@/hooks/use-dark-mode.tsx";
import {ShaderWorkspace} from "@/components/shader-workspace.tsx";
import {TemplateSelector} from "@/components/template-selector.tsx";
import {RenderSettings} from "@/components/render-settings.tsx";
import type {template_def, render_settings, tab_id} from "@/types.tsx";
import {TEMPLATES} from "@/templates.tsx";
import {clearShareHash, decodeShareUrl} from "@/utils/shader-url-codec.tsx";

function loadFromShareUrl(): {
    template: template_def;
    renderSettings: render_settings;
    shaders: Record<tab_id, string>;
} | null {
    const shared = decodeShareUrl();
    if (!shared) return null;

    const template = TEMPLATES.find(t => t.name === shared.template);
    if (!template) return null;

    clearShareHash();
    return {
        template,
        renderSettings: {
            ...shared.renderSettings,
            initialData: null,
        },
        shaders: shared.shaders,
    };
}

let SHARED_STATE: ReturnType<typeof loadFromShareUrl> = null;
try {
    SHARED_STATE = loadFromShareUrl();
} catch {
    console.warn('Failed to decode share URL');
}

function App() {
    const [isDarkMode, setIsDarkMode] = useDarkMode() as [boolean, (v: boolean) => void];

    const [selectedTemplate, setSelectedTemplate] = useState<template_def | null>(SHARED_STATE?.template ?? null);
    const [renderSettings, setRenderSettings] = useState<render_settings>(
        SHARED_STATE?.renderSettings ?? {
            vertexDrawCount: 6,
            instanceCount: 1,
            initialData: null,
        }
    );
    const [initialSharedShaders] = useState<Record<tab_id, string> | null>(SHARED_STATE?.shaders ?? null);
    const [templateSelectorOpen, setTemplateSelectorOpen] = useState<boolean>(false);
    const [renderSettingsOpen, setRenderSettingsOpen] = useState<boolean>(false);

    if (selectedTemplate === null || templateSelectorOpen) {
        return <TemplateSelector onConfirm={(template) => {
            setSelectedTemplate(template);
            setRenderSettings(template.defaultRenderSettings);
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
            key={selectedTemplate.name}
            templateName={selectedTemplate.name}
            shaderType={selectedTemplate.shaderType}
            shaderConfig={selectedTemplate.shaderConfig}
            renderSettings={renderSettings}
            initialUserShaders={initialSharedShaders}
            onChangeTemplate={() => setTemplateSelectorOpen(true)}
            onChangeRenderSettings={() => setRenderSettingsOpen(true)}
            darkMode={{isDarkMode, setIsDarkMode}}
        />
    );
}

export default App

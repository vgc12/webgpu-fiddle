import '../style.css'
import {useState} from "react";
import {useDarkMode} from "@/hooks/use-dark-mode.tsx";
import {ShaderWorkspace} from "@/components/shader-workspace.tsx";
import {TemplateSelector} from "@/components/template-selector.tsx";
import {RenderSettings} from "@/components/render-settings.tsx";
import type {template_def, render_settings} from "@/types.tsx";

function App() {
    const [isDarkMode, setIsDarkMode] = useDarkMode() as [boolean, (v: boolean) => void];

    const [selectedTemplate, setSelectedTemplate] = useState<template_def | null>(null);
    const [renderSettings, setRenderSettings] = useState<render_settings>({
        vertexDrawCount: 6,
        instanceCount: 1,
        initialData: null,
    });
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
            onChangeTemplate={() => setTemplateSelectorOpen(true)}
            onChangeRenderSettings={() => setRenderSettingsOpen(true)}
            darkMode={{isDarkMode, setIsDarkMode}}
        />
    );
}

export default App

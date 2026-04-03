import '../style.css'
import React, {useState} from "react";
import {useDarkMode} from "@/components/use-dark-mode.tsx";
import {ShaderWorkspace} from "@/components/shader-workspace.tsx";
import {ButtonLightRectangle} from "@/components/ui/button.tsx";
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import {CanvasShaderConfig, GolShaderConfig, ParticleShaderConfig} from "@/graphics/shader-builder.tsx";

const TABS = {
    compute: 'compute',
    vertex: 'vertex',
    fragment: 'fragment',
} as const;

export type tab_id = typeof TABS[keyof typeof TABS];

export type render_settings = {
    vertexDrawCount: number;
    instanceCount: number;
    initialData: any[] | null;
}

export type template_def = {
    name: string;
    description: string;
    shaderType: 'canvas' | 'particle';
    shaderConfig: ShaderConfig;
    defaultRenderSettings: render_settings;
}

const TEMPLATES: template_def[] = [
    {
        name: 'Canvas SDF',
        description: 'Full-screen fragment shader with SDF rendering',
        shaderType: 'canvas',
        shaderConfig: CanvasShaderConfig,
        defaultRenderSettings: {vertexDrawCount: 3, instanceCount: 1,initialData: null},
    },
    {
        name: 'Particle Simulation',
        description: 'Compute + vertex/fragment particle pipeline',
        shaderType: 'particle',
        shaderConfig: ParticleShaderConfig,
        defaultRenderSettings: {vertexDrawCount: 3, instanceCount: 2000, initialData: null},
    },
    {
        name: 'Game of Life',
        description: "Conway's Game of Life via compute shader",
        shaderType: 'particle',
        shaderConfig: GolShaderConfig,
        defaultRenderSettings: {vertexDrawCount: 6, instanceCount: 512 * 512, initialData: null},
    },
];

function Popup({title, children}: { title: string; children?: React.ReactNode }) {
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

function TemplateSelector({onConfirm}: { onConfirm: (template: template_def) => void }) {
    return (
        <Popup title="Select Template">
            {TEMPLATES.map((template) => (
                <ButtonLightRectangle
                    key={template.name}
                    className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                           hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                    onClick={() => onConfirm(template)}
                >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-neutral-500">{template.description}</div>
                </ButtonLightRectangle>
            ))}
        </Popup>
    );
}

function RenderSettings({renderSettings, onConfirm }: {renderSettings : render_settings | null, onConfirm: (settings: render_settings) => void }) {
    const [vertexDrawCount, setVertexDrawCount] = useState(renderSettings?.vertexDrawCount ?? 6);
    const [particleCount, setParticleCount] = useState(renderSettings?.instanceCount ?? 1);
    const [particleData, setParticleData] = useState<any[] | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);


    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
                setFileError("JSON must be an array");
                return;
            }
            setFileError(null);
            setParticleData(parsed);
        } catch {
            setFileError("Invalid JSON");
        }
    }

    return (
        <Popup title="Render Settings">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Vertex Draw Count</label>
                <input
                    type="number"
                    value={vertexDrawCount}
                    onChange={e => setVertexDrawCount(Number(e.target.value))}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600
                               bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Particle Count</label>
                <input
                    type="number"
                    value={particleCount}
                    onChange={e => setParticleCount(Number(e.target.value))}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600
                               bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Initial Particle Data</label>
                <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileChange}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600
                               bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500
                               file:mr-3 file:py-1 file:px-3 file:rounded file:border-0
                               file:bg-neutral-200 dark:file:bg-neutral-700 file:text-sm"
                />
                {fileError && <p className="text-xs text-red-500">{fileError}</p>}
                {particleData && <p className="text-xs text-green-500"> File loaded ({particleCount} particles)</p>}
            </div>
            <button
                className="mt-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={() => onConfirm({ vertexDrawCount, instanceCount: particleCount, initialData: particleData })}
            >
                Confirm
            </button>
        </Popup>
    );
}
function App() {
    useDarkMode();

    const [selectedTemplate, setSelectedTemplate] = useState<template_def | null>(null);
    const [renderSettings, setRenderSettings] = useState<render_settings>({
        vertexDrawCount: 6,
        instanceCount: 1,
        initialData : null,
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
            shaderType={selectedTemplate.shaderType}
            shaderConfig={selectedTemplate.shaderConfig}
            renderSettings={renderSettings}
            onChangeTemplate={() => setTemplateSelectorOpen(true)}
            onChangeRenderSettings={() => setRenderSettingsOpen(true)}
        />
    );
}

export default App
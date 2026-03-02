import '../style.css'
import React, {useState} from "react";
import {useDarkMode} from "@/components/use-dark-mode.tsx";
import {ShaderWorkspace} from "@/components/shader-workspace.tsx";
import {ButtonLightRectangle} from "@/components/ui/button.tsx";

const TABS = {
    compute: 'compute',
    vertex: 'vertex',
    fragment: 'fragment',
} as const;

export type tab_id = typeof TABS[keyof typeof TABS];

function Popup({children}: { children?: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-xl min-w-[300px]">
                <h2 className="text-lg font-semibold mb-4">Select Shader Type</h2>
                <div className="flex flex-col gap-3">
                    {children}
                </div>
            </div>
        </div>
    );
}

function ShaderSelector({
                            onConfirm,
                        }: {
    onConfirm: (type: 'canvas' | 'particle') => void;
}) {
    return (
        <Popup>
            <ButtonLightRectangle
                className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                       hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                onClick={() => onConfirm('canvas')}
            >
                <div className="font-medium">Canvas Shader</div>
                <div className="text-sm text-neutral-500">Full-screen fragment shader</div>
            </ButtonLightRectangle>
            <ButtonLightRectangle
                className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                       hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                onClick={() => onConfirm('particle')}
            >
                <div className="font-medium">Particle Shader</div>
                <div className="text-sm text-neutral-500">Compute + vertex/fragment pipeline</div>
            </ButtonLightRectangle>
        </Popup>
    );
}

export type render_settings = {
    vertexDrawCount: number;
    instanceCount: number;
}

function RenderSettings({
                            onConfirm,
                        }: {
    onConfirm: (settings: render_settings) => void;
}) {
    const [vertexDrawCount, setVertexDrawCount] = useState(6);
    const [particleCount, setInstanceCount] = useState(1);

    return (
        <Popup>
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
                    onChange={e => setInstanceCount(Number(e.target.value))}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600
                               bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <button
                className="mt-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={() => onConfirm({vertexDrawCount, instanceCount: particleCount})}
            >
                Confirm
            </button>
        </Popup>
    );
}

function App() {
    useDarkMode();

    const [shaderType, setShaderType] = useState<'canvas' | 'particle' | null>(null);
    const [renderSettings, setRenderSettings] = useState<render_settings>({
        vertexDrawCount: 6,
        instanceCount: 1,
    });
    const [shaderSelectorOpen, setShaderSelectorOpen] = useState<boolean>(false);
    const [renderSettingsOpen, setRenderSettingsOpen] = useState<boolean>(false);

    if (shaderType === null || shaderSelectorOpen) {
        return <ShaderSelector onConfirm={(v) => {
            setShaderType(v);
            setRenderSettings(prev => ({...prev, instanceCount: v === 'particle' ? 2000 : 1}));
            setShaderSelectorOpen(false);
        }}/>;
    } else if (renderSettingsOpen) {
        return (
            <RenderSettings
                onConfirm={(settings) => {
                    setRenderSettings(settings);
                    setRenderSettingsOpen(false);
                }}
            />
        );
    }

    return (
        <ShaderWorkspace
            key={shaderType}
            shaderType={shaderType}
            renderSettings={renderSettings}
            onChangeShaderType={() => setShaderSelectorOpen(true)}
            onChangeRenderSettings={() => setRenderSettingsOpen(true)}
        />
    );
}

export default App
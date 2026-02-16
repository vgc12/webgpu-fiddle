import '../style.css'
import {WebGPUCanvas} from "@/components/ui/main-canvas.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {MonacoEditor, type Tab} from "@/monaco/monaco-editor.tsx";
import {Panel} from "@/components/ui/panel.tsx";
import {ButtonLightRectangle} from "@/components/ui/button.tsx";

import {
    canvasShaderConfig,
    getStructFromBufferBinding,
    getWorkgroupSize,
    injectUniformsIntoShader,
    particleShaderConfig
} from "@/graphics/shader-builder.tsx";
import {useDarkMode} from "@/components/use-dark-mode.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {generateVariableDocumentation} from "@/graphics/generate-variable-documentation.tsx";
import type {ShaderConfig} from "@/graphics/shader_config.tsx";
import {type shader_diagnostic, validateShader} from "@/graphics/shader-validator.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";

const TABS = {
    compute: 'compute',
    vertex: 'vertex',
    fragment: 'fragment',
} as const;

type tab_id = typeof TABS[keyof typeof TABS];


function buildInitialShaders(config: ShaderConfig): Record<tab_id, string> {
    return {
        vertex: generateVariableDocumentation('vertex') + '\n' + config.vertexShader,
        fragment: generateVariableDocumentation('fragment') + '\n' + config.fragmentShader,
        compute: config.computeShader
                 ? generateVariableDocumentation('compute') + '\n' + config.computeShader
                 : '',
    };
}

function ShaderSelector({
                            onSelect,
                        }: {
    onSelect: (type: 'canvas' | 'particle') => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-xl min-w-[300px]">
                <h2 className="text-lg font-semibold mb-4">Select Shader Type</h2>
                <div className="flex flex-col gap-3">
                    <button
                        className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                       hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                        onClick={() => onSelect('canvas')}
                    >
                        <div className="font-medium">Canvas Shader</div>
                        <div className="text-sm text-neutral-500">Full-screen fragment shader</div>
                    </button>
                    <button
                        className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                       hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                        onClick={() => onSelect('particle')}
                    >
                        <div className="font-medium">Particle Shader</div>
                        <div className="text-sm text-neutral-500">Compute + vertex/fragment pipeline</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

function ShaderWorkspace({shaderType, onChangeType}: {
    shaderType: 'canvas' | 'particle';
    onChangeType: () => void;
}) {
    const shaderConfig: ShaderConfig = shaderType === 'canvas' ? canvasShaderConfig : particleShaderConfig;
    const initialShaders = buildInitialShaders(shaderConfig);

    const [activeTab, setActiveTab] = useState<tab_id>('vertex');
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    const [userShaders, setUserShaders] = useState<Record<tab_id, string>>(initialShaders);

    const [fullVertexShader, setFullVertexShader] = useState<string>(injectUniformsIntoShader(initialShaders.vertex));
    const [fullFragmentShader, setFullFragmentShader] = useState<string>(injectUniformsIntoShader(initialShaders.fragment));
    const [fullComputeShader, setFullComputeShader] = useState<string>(injectUniformsIntoShader(initialShaders.compute));

    const rendererRef = useRef<IRenderer | null>(null);

    const emptyDiagnostics: Record<tab_id, shader_diagnostic[]> = {vertex: [], fragment: [], compute: []};
    const [diagnostics, setDiagnostics] = useState<Record<tab_id, shader_diagnostic[]>>(emptyDiagnostics);

    // Debounced live validation — validates the active tab's shader as the user types
    useEffect(() => {
        const device = rendererRef.current?.device;
        if (!device) {
            return;
        }

        const timer = setTimeout(async () => {
            const tab = activeTabRef.current;
            const userCode = userShaders[tab];
            if (!userCode) {
                setDiagnostics(prev => ({...prev, [tab]: []}));
                return;
            }
            const fullCode = injectUniformsIntoShader(userCode);
            const diags = await validateShader(device, userCode, fullCode, tab);
            setDiagnostics(prev => ({...prev, [tab]: diags}));
        }, 500);

        return () => clearTimeout(timer);
    }, [userShaders]);

    const getTabs = useCallback(() => {
        const tabArray: Tab[] = [
            {id: 'vertex', label: 'Vertex'},
            {id: 'fragment', label: 'Fragment'},
        ]
        if (shaderType === 'particle') {
            tabArray.unshift({id: 'compute', label: 'Compute'});
        }

        return tabArray;
    }, [shaderType]);
    let options: ComputeConfig | undefined = undefined;
    if (userShaders.compute != '') {
        options = {
            count: 2000,
            inOutBufferStruct: getStructFromBufferBinding(fullComputeShader, 'input'),
            workgroupSize: getWorkgroupSize(fullComputeShader),
        }
    }
    const handleCompileAndApply = async () => {
        const newVertexShader = injectUniformsIntoShader(userShaders.vertex);
        const newFragmentShader = injectUniformsIntoShader(userShaders.fragment);
        const newComputeShader = injectUniformsIntoShader(userShaders.compute);

        const device = rendererRef.current?.device;
        if (!device) {
            return;
        }

        // Validate all shaders and collect diagnostics
        const [vertexDiags, fragmentDiags, computeDiags] = await Promise.all([
            validateShader(device, userShaders.vertex, newVertexShader, 'vertex'),
            validateShader(device, userShaders.fragment, newFragmentShader, 'fragment'),
            userShaders.compute
            ? validateShader(device, userShaders.compute, newComputeShader, 'compute')
            : Promise.resolve([]),
        ]);

        const newDiagnostics: Record<tab_id, shader_diagnostic[]> = {
            vertex: vertexDiags,
            fragment: fragmentDiags,
            compute: computeDiags,
        };
        setDiagnostics(newDiagnostics);

        const hasErrors = [...vertexDiags, ...fragmentDiags, ...computeDiags]
            .some(d => d.severity === 'error');

        if (hasErrors) {
            return;
        }

        let options: ComputeConfig | undefined = undefined;
        if (userShaders.compute != '') {
            options = {
                count: 2000,
                inOutBufferStruct: getStructFromBufferBinding(newComputeShader, 'input'),
                workgroupSize: getWorkgroupSize(newComputeShader),
            }
        }

        setFullVertexShader(newVertexShader);
        setFullFragmentShader(newFragmentShader);
        setFullComputeShader(newComputeShader);

        if (rendererRef.current) {
            try {
                await rendererRef.current.recompileShaders({
                    computeShader: newComputeShader,
                    vertexShader: newVertexShader,
                    fragmentShader: newFragmentShader,
                }, options);
            }
            catch (error) {
                console.error('Failed to recompile shaders:', error);
            }
        }
    }

    const handleEditorChange = useCallback((value: string) => {
        setUserShaders(prev => ({...prev, [activeTabRef.current]: value}));
    }, []);

    return (
        <div className={'flex flex-row h-screen w-screen'}>
            <Panel resizeDirection={"horizontal"} resizable={true} className={'w-[66vw] h-[90vh]'}>
                <WebGPUCanvas rendererRef={rendererRef} computeConfig={options} shaderType={shaderType}
                              computeShader={fullComputeShader}
                              fragmentShader={fullFragmentShader}
                              vertexShader={fullVertexShader}></WebGPUCanvas>
            </Panel>

            <Panel grow={true} resizeDirection={"horizontal"} resizable={true} className={"h-[90vh] mx-3"}>
                <div className="flex gap-2 mb-2">
                    <ButtonLightRectangle value={'Compile & Apply Shaders'} className={'flex-1'}
                                          onClick={handleCompileAndApply}/>
                    <ButtonLightRectangle value={'Change Shader Type'} onClick={onChangeType}/>
                </div>
                <MonacoEditor
                    value={userShaders[activeTab]}
                    language="wgsl"
                    onChange={handleEditorChange}
                    onCompile={handleCompileAndApply}
                    diagnostics={diagnostics[activeTab]}
                    tabs={getTabs()}
                    activeTabId={activeTab}
                    onTabChange={setActiveTab as (s: string) => void}
                    className="h-full"
                />
            </Panel>
        </div>
    );
}

function App() {
    useDarkMode();

    const [shaderType, setShaderType] = useState<'canvas' | 'particle' | null>(null);

    if (shaderType === null) {
        return <ShaderSelector onSelect={setShaderType}/>;
    }

    return (
        <ShaderWorkspace
            key={shaderType}
            shaderType={shaderType}
            onChangeType={() => setShaderType(null)}
        />
    );
}

export default App
import type {ShaderConfig} from "@/graphics/shader-config.tsx";
import {
    CanvasShaderConfig,
    getStructFromBufferBinding,
    getWorkgroupSize,
    injectUniformsIntoShader,
    ParticleShaderConfig
} from "@/graphics/shader-builder.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {type shader_diagnostic, validateShader} from "@/graphics/shader-validator.tsx";
import {MonacoEditor, type Tab} from "@/monaco/monaco-editor.tsx";
import type {ComputeConfig} from "@/graphics/compute-config.tsx";
import {Panel} from "@/components/ui/panel.tsx";
import {WebGPUCanvas} from "@/components/ui/main-canvas.tsx";
import {ButtonLightRectangle} from "@/components/ui/button.tsx";
import type {render_settings, tab_id} from "@/components/app.tsx";
import {buildInitialShaders} from "@/components/build-initial-shaders.tsx";

export function ShaderWorkspace({shaderType, renderSettings, onChangeRenderSettings, onChangeShaderType}: {
    shaderType: 'canvas' | 'particle'
    renderSettings: render_settings
    onChangeShaderType: () => void;
    onChangeRenderSettings: () => void;
}) {
    const shaderConfig: ShaderConfig = shaderType === 'canvas' ? CanvasShaderConfig : ParticleShaderConfig;
    const initialShaders = buildInitialShaders(shaderConfig, shaderType);

    const [activeTab, setActiveTab] = useState<tab_id>('vertex');
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    const [userShaders, setUserShaders] = useState<Record<tab_id, string>>(initialShaders);

    const [fullVertexShader, setFullVertexShader] = useState(injectUniformsIntoShader(initialShaders.vertex));
    const [fullFragmentShader, setFullFragmentShader] = useState(injectUniformsIntoShader(initialShaders.fragment));
    const [fullComputeShader, setFullComputeShader] = useState(injectUniformsIntoShader(initialShaders.compute));

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
            const diags = await validateShader(device, userCode, fullCode.code, tab, fullCode.prefixLineCount,fullCode.injections );
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
            inOutBufferStruct: getStructFromBufferBinding(fullComputeShader.code, 'input'),
            workgroupSize: getWorkgroupSize(fullComputeShader.code),
            particleCount: renderSettings.instanceCount,
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
            validateShader(device, userShaders.vertex, newVertexShader.code, 'vertex', newVertexShader.prefixLineCount, newVertexShader.injections),
            validateShader(device, userShaders.fragment, newFragmentShader.code, 'fragment', newVertexShader.prefixLineCount, newComputeShader.injections),
            userShaders.compute
            ? validateShader(device, userShaders.compute, newComputeShader.code, 'compute', newComputeShader.prefixLineCount, newComputeShader.injections)
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
                inOutBufferStruct: getStructFromBufferBinding(newComputeShader.code, 'input'),
                workgroupSize: getWorkgroupSize(newComputeShader.code),
                particleCount: renderSettings.instanceCount,
            }
        }

        setFullVertexShader(newVertexShader);
        setFullFragmentShader(newFragmentShader);
        setFullComputeShader(newComputeShader);

        if (rendererRef.current) {
            try {
                await rendererRef.current.recompileShaders({
                    computeShader: newComputeShader.code,
                    vertexShader: newVertexShader.code,
                    fragmentShader: newFragmentShader.code,
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
                <WebGPUCanvas rendererRef={rendererRef} computeConfig={options} renderSettings={renderSettings}
                              shaderType={shaderType}
                              computeShader={fullComputeShader.code}
                              fragmentShader={fullFragmentShader.code}
                              vertexShader={fullVertexShader.code}></WebGPUCanvas>
            </Panel>

            <Panel grow={true} resizeDirection={"horizontal"} resizable={true} className={"h-[90vh] mx-3"}>
                <div className="flex gap-2 mb-2">
                    <ButtonLightRectangle
                        onClick={handleCompileAndApply}>Compile & Apply Shaders</ButtonLightRectangle>
                    <ButtonLightRectangle onClick={onChangeShaderType}>Change Shader Type</ButtonLightRectangle>
                    <ButtonLightRectangle onClick={onChangeRenderSettings}>Render Settings</ButtonLightRectangle>
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
                    className="grow"
                />
            </Panel>
        </div>
    );
}
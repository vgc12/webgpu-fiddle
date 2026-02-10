import '../style.css'
import {WebGPUCanvas} from "@/components/ui/main-canvas.tsx";
import {useCallback, useEffect, useRef, useState} from "react";
import {MonacoEditor, type Tab} from "@/monaco/monaco-editor.tsx";
import {registerWGSL} from "@/monaco/registerWGSL.tsx";
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


function App() {
    /*const [isDarkMode, setIsDarkMode] =*/
    useDarkMode();

    const [shaderType, setShaderType] = useState<'canvas' | 'particle'>('canvas');

    const shaderConfig: ShaderConfig = shaderType === 'canvas' ? canvasShaderConfig : particleShaderConfig;


    const tab = {
        compute: 'compute',
        vertex: 'vertex',
        fragment: 'fragment',
    } as const;

    type tabs = typeof tab[keyof typeof tab];

    const [activeTab, setActiveTab] = useState<tabs>('vertex');

    const [tabs, setTabs] = useState<Record<tabs, string>>({
        'compute': generateVariableDocumentation('compute') + shaderConfig.computeShader,
        'vertex': generateVariableDocumentation('vertex') + shaderConfig.vertexShader,
        'fragment': generateVariableDocumentation('fragment') + shaderConfig.fragmentShader,
    });

    const [vertexShader, setVertexShader] = useState<string>(injectUniformsIntoShader(tabs.vertex));
    const [fragmentShader, setFragmentShader] = useState<string>(injectUniformsIntoShader(tabs.fragment));
    const [computeShader, setComputeShader] = useState<string>(injectUniformsIntoShader(tabs.compute));

    const rendererRef = useRef<IRenderer | null>(null);

    useEffect(() => {
        registerWGSL();
    }, []);

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
    const handleEditorChange = useCallback((value: string) => {
        setTabs(prev => ({...prev, [activeTab]: value}))
    }, [activeTab]);
    const handleCompileAndApply = async () => {

        const newVertexShader = injectUniformsIntoShader(tabs.vertex);
        const newFragmentShader = injectUniformsIntoShader(tabs.fragment);
        const newComputeShader = injectUniformsIntoShader(tabs.compute);

        const computeStructs = getStructFromBufferBinding(newComputeShader, 'input');
        const workGroupSize = getWorkgroupSize(newComputeShader);
        console.log("computeStructs", computeStructs);

        setVertexShader(newVertexShader);
        setFragmentShader(newFragmentShader);
        setComputeShader(newComputeShader);

        console.log(newVertexShader);
        console.log(newComputeShader);

        // Recompile shaders without reinitializing
        if (rendererRef.current) {
            try {

                await rendererRef.current.recompileShaders({
                    computeShader: newComputeShader,
                    vertexShader: newVertexShader,
                    fragmentShader: newFragmentShader,
                }, {
                    count: 2000,
                    inOutBufferStruct: computeStructs,
                    workgroupSize: workGroupSize,
                });
                console.log('Shaders recompiled successfully!');
            } catch (error) {
                console.error('Failed to recompile shaders:', error);
            }
        }
    }
    registerWGSL();
    return (
        <>
            <div className={'flex flex-row h-screen w-screen'}>
                <Panel resizeDirection={"horizontal"} resizable={true} className={'w-[66vw] h-[90vh]'}>
                    <WebGPUCanvas rendererRef={rendererRef} computeShader={computeShader}
                                  fragmentShader={fragmentShader} vertexShader={vertexShader}></WebGPUCanvas>
                </Panel>

                <Panel grow={true} resizeDirection={"horizontal"} resizable={true} className={"h-[90vh] mx-3"}>
                    <ButtonLightRectangle value={'Compile & Apply Shaders'} className={'mb-2 w-full'}
                                          onClick={handleCompileAndApply}/>
                    <MonacoEditor
                        value={tabs[activeTab]}
                        language="wgsl"
                        onChange={handleEditorChange
                        }
                        tabs={getTabs()}
                        onTabChange={(s) => {
                            const t = s as tabs;
                            setActiveTab(t)
                        }
                        }
                        className="h-full"
                    />

                </Panel>

            </div>
        </>
    )
}

export default App

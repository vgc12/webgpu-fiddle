import '../style.css'
import {WebGPUCanvas} from "@/components/ui/main-canvas.tsx";
import {useEffect, useRef, useState} from "react";
import {MonacoEditor} from "@/monaco/monaco-editor.tsx";
import {registerWGSL} from "@/monaco/registerWGSL.tsx";
import {Panel} from "@/components/ui/panel.tsx";
import {ButtonLightRectangle} from "@/components/ui/button.tsx";

import {createRenderShader} from "@/graphics/create-render-shader.tsx";
import {
    getDefaultParticleComputeShader,
    getDefaultParticleFragmentShader,
    getDefaultParticleVertexShader,
    type ShaderType
} from "@/graphics/shader-builder.tsx";
import {createComputeShader} from "@/graphics/create-compute-shader.tsx";
import {useDarkMode} from "@/components/use-dark-mode.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {generateVariableDocumentation} from "@/graphics/generate-variable-documentation.tsx";


function App() {
    /*const [isDarkMode, setIsDarkMode] =*/
    useDarkMode();

    const [activeTab, setActiveTab] = useState<ShaderType>('compute');

    const [shaders, setShaders] = useState<Record<ShaderType, string>>({
        'compute': generateVariableDocumentation('compute') + getDefaultParticleComputeShader(),
        'vertex': generateVariableDocumentation('vertex') + getDefaultParticleVertexShader(),
        'fragment': generateVariableDocumentation('fragment') + getDefaultParticleFragmentShader(),
    });

    const [graphicsShader, setGraphicsShader] = useState<string>(createRenderShader(shaders.vertex, shaders.fragment));
    const [computeShader, setComputeShader] = useState<string>(createComputeShader(shaders.compute));
    const rendererRef = useRef<IRenderer | null>(null);

    useEffect(() => {
        registerWGSL();
    }, []);

    const handleCompileAndApply = async () => {
        const newGraphicsShader = createRenderShader(shaders.vertex, shaders.fragment);
        const newComputeShader = createComputeShader(shaders.compute);

        setGraphicsShader(newGraphicsShader);
        setComputeShader(newComputeShader);

        console.log(newGraphicsShader);
        console.log(newComputeShader);

        // Recompile shaders without reinitializing
        if (rendererRef.current) {
            try {
                
                await rendererRef.current.recompileShaders({
                    computeShader: newComputeShader,
                    graphicsShader: newGraphicsShader
                });
                console.log('Shaders recompiled successfully!');
            }
            catch (error) {
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
                                  graphicsShader={graphicsShader}></WebGPUCanvas>
                </Panel>

                <Panel grow={true} resizeDirection={"horizontal"} resizable={true} className={"h-[90vh] mx-3"}>
                    <ButtonLightRectangle value={'Compile & Apply Shaders'} className={'mb-2 w-full'}
                                          onClick={handleCompileAndApply}/>
                    <MonacoEditor
                        value={shaders[activeTab]}
                        language="wgsl"
                        onChange={(value) => setShaders({...shaders, [activeTab]: value})}
                        tabs={[
                            {id: 'compute', label: 'Compute'},
                            {id: 'vertex', label: 'Vertex'},
                            {id: 'fragment', label: 'Fragment'},
                        ]}
                        onTabChange={setActiveTab as (s: string) => void}

                        className="h-full"
                    />

                </Panel>

            </div>
        </>
    )
}

export default App

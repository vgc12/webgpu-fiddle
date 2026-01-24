import '../style.css'
import {WebGPUCanvas} from "@/components/ui/main-canvas.tsx";
import {useState} from "react";
import {MonacoEditor} from "@/monaco/monaco-editor.tsx";
import {registerWGSL} from "@/monaco/registerWGSL.tsx";
import {Panel} from "@/components/ui/panel.tsx";
import {ButtonLightRectangle} from "@/components/ui/button.tsx";

import {createRenderShader} from "@/graphics/create-render-shader.tsx";
import {
    getDefaultParticleComputeShader,
    getDefaultParticleFragmentShader,
    getDefaultParticleVertexShader
} from "@/graphics/shader-builder.tsx";
import {createComputeShader} from "@/graphics/create-compute-shader.tsx";


function App() {

    const [activeTab, setActiveTab] = useState('compute');

    const [shaders, setShaders] = useState({
        'compute': getDefaultParticleComputeShader(),
        'vertex': getDefaultParticleVertexShader(),
        'fragment': getDefaultParticleFragmentShader(),
    });

    const [graphicsShader, setGraphicsShader] = useState<string>(createRenderShader(shaders.vertex, shaders.fragment));
    const [computeShader, setComputeShader] = useState<string>(createComputeShader(shaders.compute));
    const handleCompileAndApply = () => {
        setGraphicsShader(createRenderShader(shaders.vertex, shaders.fragment));
        setComputeShader(createComputeShader(shaders.compute));
        console.log(graphicsShader);
        console.log(computeShader);

    }
    registerWGSL();
    return (
        <>
            <div className={'flex flex-row h-screen w-screen'}>
                <Panel resizeDirection={"horizontal"} resizable={true} className={'w-[66vw] h-[90vh]'}>
                    <WebGPUCanvas computeShader={computeShader} graphicsShader={graphicsShader}></WebGPUCanvas>
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
                        activeTabId={activeTab}
                        onTabChange={setActiveTab}
                        className="h-full"
                    />

                </Panel>

            </div>
        </>
    )
}

export default App

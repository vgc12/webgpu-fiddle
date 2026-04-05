import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {useRef} from "react";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import {MonacoEditor} from "@/components/editor/monaco-editor.tsx";
import {WebGPUCanvas} from "@/components/ui/main-canvas.tsx";
import {SplitPane} from "@/components/ui/split-pane.tsx";
import {Toolbar} from "@/components/ui/toolbar.tsx";
import type {dark_mode_props, render_settings} from "@/types.tsx";
import {useShaderCompilation} from "@/hooks/use-shader-compilation.tsx";

export function ShaderWorkspace({shaderType, shaderConfig, renderSettings, onChangeRenderSettings, onChangeTemplate, templateName, darkMode}: {
    shaderType: 'canvas' | 'particle'
    shaderConfig: ShaderConfig
    renderSettings: render_settings
    templateName: string
    onChangeTemplate: () => void;
    onChangeRenderSettings: () => void;
    darkMode: dark_mode_props;
}) {
    const rendererRef = useRef<IRenderer | null>(null);

    // this is an affront to god in every religion but still genuinely better than having this all within this file.
    const {
        activeTab,
        setActiveTab,
        userShaders,
        fullVertexShader,
        fullFragmentShader,
        fullComputeShader,
        diagnostics,
        computeConfig,
        getTabs,
        handleCompileAndApply,
        handleEditorChange,
        handleDownloadShaders,
    } = useShaderCompilation(shaderConfig, shaderType, renderSettings, rendererRef);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden px-2  bg-gray-50 dark:bg-gray-900 ">
            <Toolbar
                templateName={templateName}
                darkMode={darkMode}
                onCompile={handleCompileAndApply}
                onChangeTemplate={onChangeTemplate}
                onChangeRenderSettings={onChangeRenderSettings}
                onDownload={handleDownloadShaders}
            />

            <SplitPane className="grow min-h-0 my-4 rounded-sm dark:bg-gray-800 bg-gray-100">
                <div className="flex flex-col h-full p-2">
                    <div className="flex-1 overflow-hidden">
                        <WebGPUCanvas rendererRef={rendererRef} computeConfig={computeConfig} renderSettings={renderSettings}
                                      shaderType={shaderType}
                                      computeShader={fullComputeShader.code}
                                      fragmentShader={fullFragmentShader.code}
                                      vertexShader={fullVertexShader.code} />
                    </div>
                </div>
                <div className="flex flex-col h-full p-2">
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <MonacoEditor
                            value={userShaders[activeTab]}
                            language="wgsl"
                            onChange={handleEditorChange}
                            onCompile={handleCompileAndApply}
                            diagnostics={diagnostics[activeTab]}
                            tabs={getTabs()}
                            activeTabId={activeTab}
                            onTabChange={setActiveTab as (s: string) => void}
                            darkMode={darkMode.isDarkMode}
                            className="grow"
                        />
                    </div>
                </div>
            </SplitPane>
        </div>
    );
}

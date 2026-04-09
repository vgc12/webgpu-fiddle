import {useCallback, useEffect, useRef, useState} from "react";
import {
    getStructFromBufferBinding,
    getWorkgroupSize,
    injectUniformsIntoShader,
} from "@/graphics/shaders/shader-builder.tsx";
import {type shader_diagnostic, validateShader} from "@/graphics/shaders/shader-validator.tsx";
import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import type {render_settings, tab_id} from "@/types.tsx";
import {buildInitialShaders} from "@/hooks/build-initial-shaders.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import type {Tab} from "@/components/editor/monaco-editor.tsx";
import JSZip from "jszip";

export function useShaderCompilation(
    shaderConfig: ShaderConfig,
    shaderType: 'canvas' | 'particle',
    renderSettings: render_settings,
    rendererRef: React.RefObject<IRenderer | null>,
) {
    const initialShaders = buildInitialShaders(shaderConfig, shaderType);

    const [activeTab, setActiveTab] = useState<tab_id>('vertex');
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    const [userShaders, setUserShaders] = useState<Record<tab_id, string>>(initialShaders);

    const [fullVertexShader, setFullVertexShader] = useState(injectUniformsIntoShader(initialShaders.vertex));
    const [fullFragmentShader, setFullFragmentShader] = useState(injectUniformsIntoShader(initialShaders.fragment));
    const [fullComputeShader, setFullComputeShader] = useState(injectUniformsIntoShader(initialShaders.compute));

    const emptyDiagnostics: Record<tab_id, shader_diagnostic[]> = {vertex: [], fragment: [], compute: []};
    const [diagnostics, setDiagnostics] = useState<Record<tab_id, shader_diagnostic[]>>(emptyDiagnostics);

    // Debounced live validation
    useEffect(() => {
        const device = rendererRef.current?.device;
        if (!device) return;

        const timer = setTimeout(async () => {
            const tab = activeTabRef.current;
            const userCode = userShaders[tab];
            if (!userCode) {
                setDiagnostics(prev => ({...prev, [tab]: []}));
                return;
            }
            const fullCode = injectUniformsIntoShader(userCode);
            const diags = await validateShader(device, userCode, fullCode.code, tab, fullCode.prefixLineCount, fullCode.injections);
            setDiagnostics(prev => ({...prev, [tab]: diags}));
        }, 500);

        return () => clearTimeout(timer);
    }, [userShaders]);

    const getTabs = useCallback((): Tab[] => {
        const tabArray: Tab[] = [
            {id: 'vertex', label: 'Vertex'},
            {id: 'fragment', label: 'Fragment'},
        ];
        if (shaderType === 'particle') {
            tabArray.unshift({id: 'compute', label: 'Compute'});
        }
        return tabArray;
    }, [shaderType]);

    function createComputeConfig(): ComputeConfig | undefined {
        if (userShaders.compute != '') {
            return {
                inOutBufferStruct: getStructFromBufferBinding(fullComputeShader.code, 'input'),
                workgroupSize: getWorkgroupSize(fullComputeShader.code),
                particleCount: renderSettings.instanceCount,
                initialData: renderSettings.initialData,
            };
        }
        return undefined;
    }

    const computeConfig = createComputeConfig();

    const handleCompileAndApply = async () => {
        const newVertexShader = injectUniformsIntoShader(userShaders.vertex);
        const newFragmentShader = injectUniformsIntoShader(userShaders.fragment);
        const newComputeShader = injectUniformsIntoShader(userShaders.compute);

        const device = rendererRef.current?.device;
        if (!device) return;

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

        if (hasErrors) return;

        const options = createComputeConfig();

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
            } catch (error) {
                console.error('Failed to recompile shaders:', error);
            }
        }
    };

    const handleEditorChange = useCallback((value: string) => {
        setUserShaders(prev => ({...prev, [activeTabRef.current]: value}));
    }, []);

    const handleUploadShaders = async (file: File) => {
        const zip = await JSZip.loadAsync(file);
        const updates: Partial<Record<tab_id, string>> = {};

        for (const [filename, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue;
            const name = filename.toLowerCase();
            const content = await entry.async("string");

            if (/vert/.test(name)) {
                updates.vertex = content;
            } else if (/frag/.test(name)) {
                updates.fragment = content;
            } else if (/compute/.test(name)) {
                updates.compute = content;
            }
        }

        if (Object.keys(updates).length > 0) {
            setUserShaders(prev => ({...prev, ...updates}));
        }
    }

    const handleDownloadShaders = async () => {
        const zip = new JSZip();
        zip.file("vertex.wgsl", userShaders.vertex);
        zip.file("fragment.wgsl", userShaders.fragment);
        if (shaderType === 'particle' && userShaders.compute) {
            zip.file("compute.wgsl", userShaders.compute);
        }
        const blob = await zip.generateAsync({type: "blob"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "shaders.zip";
        a.click();
        URL.revokeObjectURL(url);
    };

    return {
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
        handleUploadShaders,
    };
}

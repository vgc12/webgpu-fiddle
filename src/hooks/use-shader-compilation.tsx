import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    getStructFromBufferBinding,
    getWorkgroupSize,
    injectUniformsIntoShader,
} from "@/graphics/shaders/shader-builder.tsx";
import {type shader_diagnostic, validateShader} from "@/graphics/shaders/shader-validator.tsx";
import type {ComputeConfig} from "@/graphics/pipelines/compute-config.tsx";
import type {IRenderer} from "@/graphics/i-renderer.tsx";
import type {render_settings, tab_id} from "@/types.tsx";
import {buildInitialShaders} from "@/graphics/shaders/build-initial-shaders.tsx";
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import type {Tab} from "@/components/editor/monaco-editor.tsx";
import JSZip from "jszip";

/**
 * Central hook that owns all shader state and orchestrates the compile, validate,
 * upload, download, and share workflows. It sits between the Monaco editor (which
 * provides raw user code) and the WebGPU renderer (which consumes fully injected
 * WGSL source).
 *
 * Responsibilities:
 *  - Maintains the user-edited shader source for each tab (vertex, fragment, compute, background).
 *  - Produces "full" shaders by injecting uniform declarations into user code via shader-builder.
 *  - Runs debounced live validation (500ms) on the active tab so errors appear as the user types.
 *  - On explicit compile, validates all tabs, then pushes the new shaders to the renderer.
 *  - Builds the ComputeConfig (struct layout, workgroup size, particle count, initial data)
 *    that the ParticleRenderer needs to create its GPU buffers.
 *  - Handles zip-based shader download/upload with metadata for cross-template portability.
 *
 * @param shaderConfig - The shader configuration from the active template (defines default shaders).
 * @param renderType - Whether the active template is 'canvas' or 'particle'.
 * @param renderSettings - Current render settings (vertex draw count, instance count, initial data).
 * @param rendererRef - Ref to the active IRenderer instance for recompilation calls.
 * @param sharedShaders - Optional pre-loaded shaders from a share URL or uploaded zip.
 */
export function useShaderCompilation(
    shaderConfig: ShaderConfig,
    renderType: 'canvas' | 'particle',
    renderSettings: render_settings,
    rendererRef: React.RefObject<IRenderer | null>,
    sharedShaders?: Record<tab_id, string>,
) {
    // Use shared/uploaded shaders if provided, otherwise build defaults from the template
    const initialShaders = sharedShaders ?? buildInitialShaders(shaderConfig);

    const [activeTab, setActiveTab] = useState<tab_id>('vertex');
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    // Raw user code per tab, exactly as typed in the editor
    const [userShaders, setUserShaders] = useState<Record<tab_id, string>>(initialShaders);

    // Full shaders with injected uniform block prepended (these are what the GPU compiles)
    const [fullVertexShader, setFullVertexShader] = useState(injectUniformsIntoShader(initialShaders.vertex));
    const [fullFragmentShader, setFullFragmentShader] = useState(injectUniformsIntoShader(initialShaders.fragment));
    const [fullComputeShader, setFullComputeShader] = useState(injectUniformsIntoShader(initialShaders.compute));
    const [fullBackgroundShader, setFullBackgroundShader] = useState(injectUniformsIntoShader(initialShaders.background ?? ''));

    const emptyDiagnostics: Record<tab_id, shader_diagnostic[]> = {vertex: [], fragment: [], compute: [], background: []};
    const [diagnostics, setDiagnostics] = useState<Record<tab_id, shader_diagnostic[]>>(emptyDiagnostics);

    // Debounced live validation: validates the active tab 500ms after the user stops typing.
    // Only validates (surfaces errors in the editor), does NOT recompile or update the renderer.
    useEffect(() => {
        const device = rendererRef.current?.Device;
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

    /** Returns the editor tab definitions based on the current shader type. */
    const getTabs = useCallback((): Tab[] => {
        const tabArray: Tab[] = [
            {id: 'vertex', label: 'Vertex'},
            {id: 'fragment', label: 'Fragment'},
        ];
        if (renderType === 'particle') {
            tabArray.unshift({id: 'compute', label: 'Compute'});
            if (userShaders.background) {
                tabArray.push({id: 'background', label: 'Background'});
            }
        }
        return tabArray;
    }, [renderType, userShaders.background]);

    /**
     * Builds a ComputeConfig from the current compute shader and render settings.
     * Parses the compute shader to extract the input/output buffer struct layout and
     * workgroup size. Returns undefined for canvas-only templates (no compute shader).
     */
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

    /**
     * Validates all shader tabs, and if no errors are found, injects uniforms into
     * each shader and pushes the new source to the renderer via recompileShaders().
     * Called when the user clicks Compile or presses the compile shortcut.
     */
    const handleCompileAndApply = async () => {
        const newVertexShader = injectUniformsIntoShader(userShaders.vertex);
        const newFragmentShader = injectUniformsIntoShader(userShaders.fragment);
        const newComputeShader = injectUniformsIntoShader(userShaders.compute);
        const newBackgroundShader = userShaders.background
            ? injectUniformsIntoShader(userShaders.background)
            : { code: '', prefixLineCount: 0, injections: [] };

        const device = rendererRef.current?.Device;
        if (!device) return;

        // Validate all tabs in parallel
        const validations = [
            validateShader(device, userShaders.vertex, newVertexShader.code, 'vertex', newVertexShader.prefixLineCount, newVertexShader.injections),
            validateShader(device, userShaders.fragment, newFragmentShader.code, 'fragment', newFragmentShader.prefixLineCount, newFragmentShader.injections),
            userShaders.compute
                ? validateShader(device, userShaders.compute, newComputeShader.code, 'compute', newComputeShader.prefixLineCount, newComputeShader.injections)
                : Promise.resolve([]),
            userShaders.background
                ? validateShader(device, userShaders.background, newBackgroundShader.code, 'background', newBackgroundShader.prefixLineCount, newBackgroundShader.injections)
                : Promise.resolve([]),
        ];

        const [vertexDiags, fragmentDiags, computeDiags, backgroundDiags] = await Promise.all(validations);

        const newDiagnostics: Record<tab_id, shader_diagnostic[]> = {
            vertex: vertexDiags,
            fragment: fragmentDiags,
            compute: computeDiags,
            background: backgroundDiags,
        };
        setDiagnostics(newDiagnostics);

        // Abort if any tab has errors
        const hasErrors = [...vertexDiags, ...fragmentDiags, ...computeDiags, ...backgroundDiags]
            .some(d => d.severity === 'error');

        if (hasErrors) return;

        const options = userShaders.compute ? {
            inOutBufferStruct: getStructFromBufferBinding(newComputeShader.code, 'input'),
            workgroupSize: getWorkgroupSize(newComputeShader.code),
            particleCount: renderSettings.instanceCount,
            initialData: renderSettings.initialData,
        } : undefined;

        // Validate workgroup size does not exceed the WebGPU limit of 256 total invocations
        if (options) {
            const [wx, wy, wz] = options.workgroupSize;
            const totalInvocations = wx * wy * wz;
            if (totalInvocations > 256) {
                const workgroupLine = userShaders.compute
                    .split('\n')
                    .findIndex(line => /@workgroup_size/.test(line));
                const diag: shader_diagnostic = {
                    line: workgroupLine >= 0 ? workgroupLine + 1 : 1,
                    column: 0,
                    length: 0,
                    message: `Workgroup size (${wx}, ${wy}, ${wz}) = ${totalInvocations} invocations exceeds the WebGPU maximum of 256.`,
                    severity: 'error',
                };
                setDiagnostics(prev => ({...prev, compute: [...prev.compute, diag]}));
                return;
            }
        }

        setFullVertexShader(newVertexShader);
        setFullFragmentShader(newFragmentShader);
        setFullComputeShader(newComputeShader);
        setFullBackgroundShader(newBackgroundShader);

        // Push new shaders to the renderer, rebuilding pipelines (and buffers if struct changed)
        if (rendererRef.current) {
            try {
                await rendererRef.current.recompileShaders({
                    computeShader: newComputeShader.code,
                    vertexShader: newVertexShader.code,
                    fragmentShader: newFragmentShader.code,
                    backgroundShader: newBackgroundShader.code || undefined,
                }, options ? { computeConfig: options } : undefined);
            } catch (error) {
                console.error('Failed to recompile shaders:', error);
            }
        }
    };

    /** Updates the shader source for the currently active editor tab. */
    const handleEditorChange = useCallback((value: string) => {
        setUserShaders(prev => ({...prev, [activeTabRef.current]: value}));
    }, []);

    /**
     * Uploads a zip file containing WGSL shader files and an optional metadata.json.
     * If metadata indicates a different shader type than the current template,
     * invokes onSwitchTemplate to change to a matching template with the uploaded shaders.
     * Otherwise, loads the shaders into the current editor tabs.
     */
    const handleUploadShaders = async (file: File, onSwitchTemplate?: (shaderType: 'canvas' | 'particle', shaders: Partial<Record<tab_id, string>>) => void) => {
        const zip = await JSZip.loadAsync(file);
        const updates: Partial<Record<tab_id, string>> = {};

        // Check for metadata to determine the shader type the zip was created from
        let uploadedShaderType: 'canvas' | 'particle' | undefined;
        const metadataFile = zip.file("metadata.json");
        if (metadataFile) {
            try {
                const meta = JSON.parse(await metadataFile.async("string"));
                uploadedShaderType = meta.shaderType;
            } catch { /* ignore malformed metadata */ }
        }

        // Match files to tabs by name pattern
        for (const [filename, entry] of Object.entries(zip.files)) {
            if (entry.dir || filename === "metadata.json") continue;
            const name = filename.toLowerCase();
            const content = await entry.async("string");

            if (/background/.test(name)) {
                updates.background = content;
            } else if (/vert/.test(name)) {
                updates.vertex = content;
            } else if (/frag/.test(name)) {
                updates.fragment = content;
            } else if (/compute/.test(name)) {
                updates.compute = content;
            }
        }

        if (Object.keys(updates).length === 0) return;

        // If the uploaded shaders are for a different renderer type, switch templates
        if (uploadedShaderType && uploadedShaderType !== renderType && onSwitchTemplate) {
            onSwitchTemplate(uploadedShaderType, updates);
            return;
        }

        setUserShaders(prev => ({...prev, ...updates}));
    }

    /**
     * Downloads the current shaders as a zip file containing one .wgsl file per tab
     * and a metadata.json with the shader type for cross-template upload support.
     */
    const handleDownloadShaders = async () => {
        const zip = new JSZip();
        zip.file("metadata.json", JSON.stringify({ shaderType: renderType }));
        zip.file("vertex.wgsl", userShaders.vertex);
        zip.file("fragment.wgsl", userShaders.fragment);
        if (renderType === 'particle' && userShaders.compute) {
            zip.file("compute.wgsl", userShaders.compute);
        }
        if (userShaders.background) {
            zip.file("background.wgsl", userShaders.background);
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
        fullBackgroundShader,
        diagnostics,
        computeConfig,
        getTabs,
        handleCompileAndApply,
        handleEditorChange,
        handleDownloadShaders,
        handleUploadShaders,
    };
}

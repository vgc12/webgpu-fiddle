import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {generateVariableDocumentation} from "@/graphics/shaders/generate-variable-documentation.tsx";
import type {tab_id} from "@/types.tsx";

export function buildInitialShaders(config: ShaderConfig,renderType : 'canvas' | 'particle' ): Record<tab_id, string> {
    return {
        vertex: generateVariableDocumentation('vertex', renderType) + '\n' + config.vertexShader,
        fragment: generateVariableDocumentation('fragment',renderType) + '\n' + config.fragmentShader,
        compute: config.computeShader ? generateVariableDocumentation('compute', renderType) + '\n' + config.computeShader : '',
        background: config.backgroundShader ? generateVariableDocumentation('background', renderType) + '\n' + config.backgroundShader : '',
    };
}

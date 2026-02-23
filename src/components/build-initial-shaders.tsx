import type {ShaderConfig} from "@/graphics/shader_config.tsx";
import {generateVariableDocumentation} from "@/graphics/generate-variable-documentation.tsx";
import type {tab_id} from "@/components/app.tsx";

export function buildInitialShaders(config: ShaderConfig): Record<tab_id, string> {
    return {
        vertex: generateVariableDocumentation('vertex') + '\n' + config.vertexShader,
        fragment: generateVariableDocumentation('fragment') + '\n' + config.fragmentShader,
        compute: config.computeShader
                 ? generateVariableDocumentation('compute') + '\n' + config.computeShader
                 : '',
    };
}
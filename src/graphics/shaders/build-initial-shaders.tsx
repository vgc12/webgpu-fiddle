import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";
import {generateVariableDocumentation} from "@/graphics/shaders/generate-variable-documentation.tsx";
import type {tab_id} from "@/types.tsx";

/** Builds the actual shaders that are displayed in the editor on load.
 *
 * @param config a ShaderConfig that contains the shader code
 */
export function buildInitialShaders(config: ShaderConfig,): Record<tab_id, string> {
    return {
        vertex: generateVariableDocumentation('vertex' ) + '\n' + config.vertexShader,
        fragment: generateVariableDocumentation('fragment') + '\n' + config.fragmentShader,
        compute: config.computeShader ? generateVariableDocumentation('compute') + '\n' + config.computeShader : '',
        background: config.backgroundShader ? generateVariableDocumentation('background') + '\n' + config.backgroundShader : '',
    };
}

import type {ShaderVariableMap} from "@/graphics/shaders/shader-variable-map.tsx";

/**
 * Gets the variable mapping for fragment shaders
 * Users have access to: color (input), fragCoord
 */
export function getFragmentVariableMap(): ShaderVariableMap {
    return {
        userVariables: ['color', 'fragCoord'],
        parameterMap: new Map([
            ['color', '@location(0) color: vec4<f32>'],
            ['fragCoord', '@builtin(position) fragCoord: vec4<f32>'],
        ])
    };
}
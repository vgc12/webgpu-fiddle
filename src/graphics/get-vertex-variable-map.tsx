import type {VertexAttribute} from "@/graphics/shader-builder.tsx";
import type {ShaderVariableMap} from "@/graphics/shader-variable-map.tsx";

/**
 * Gets the variable mapping for vertex shaders
 * Users have access to: vertexIndex, output, and all vertex attributes
 */
export function getVertexVariableMap(attributes?: VertexAttribute[]): ShaderVariableMap {
    const attrs = attributes || [
        {location: 0, name: 'particlePos', type: 'vec2<f32>'},
        {location: 1, name: 'particleVel', type: 'vec2<f32>'},
    ];

    const userVars = ['vertexIndex', 'output', ...attrs.map(a => a.name)];
    const paramMap = new Map([
        ['vertexIndex', '@builtin(vertex_index) vertexIndex: u32'],
        ...attrs.map(attr => [
            attr.name,
            `@location(${attr.location}) ${attr.name}: ${attr.type}`
        ] as [string, string])
    ]);

    return {userVariables: userVars, parameterMap: paramMap};
}
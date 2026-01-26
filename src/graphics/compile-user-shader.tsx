import {ShaderBuilder, type ShaderType, type VertexAttribute} from "@/graphics/shader-builder.tsx";
import {extractFunctionBody} from "@/graphics/extract-function-body.tsx";

/**
 * Compiles user shader code into a complete WGSL shader based on type
 * Users write fn main() with access to simplified builtins
 *
 * @param shaderType - Type of shader to build ('compute', 'vertex', or 'fragment')
 * @param userCode - The user's shader code
 * @param vertexCode - Optional vertex code (for 'vertex' type when building both stages)
 * @param fragmentCode - Optional fragment code (for 'vertex' type when building both stages)
 * @returns Complete WGSL shader code
 * @throws Error if shader type is unknown or required parameters are missing
 *
 * @example
 * ```typescript
 * // Compute shader
 * const compute = compileUserShader('compute', 'fn main() { output[global_id.x] = input[global_id.x]; }');
 *
 * // Vertex + Fragment
 * const render = compileUserShader(
 *   'vertex',
 *   'fn main() { output.position = vec4(pos, 0.0, 1.0); }',
 *   'fn main() { output.color = vec4(1.0); }',
 *   'fn main() { return color; }'
 * );
 * ```
 */
export function compileUserShader(
    shaderType: ShaderType,
    userCode: string,
    vertexCode?: string,
    fragmentCode?: string
): string {
    const builder = new ShaderBuilder();

    if (shaderType === 'compute') {
        builder.addStructs(`
struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
}
    `);

        builder.addBindings(`
@group(0) @binding(1) var<storage, read> input: array<Particle>;
@group(0) @binding(2) var<storage, read_write> output: array<Particle>;
    `);


        return builder.buildCompute(extractFunctionBody(userCode));
    }

    if (shaderType === 'vertex') {
        const attributes: VertexAttribute[] = [
            {location: 0, name: 'particlePos', type: 'vec2<f32>'},
            {location: 1, name: 'particleVel', type: 'vec2<f32>'},
        ];

        if (vertexCode && fragmentCode) {
            // Build combined vertex + fragment shader
            builder.addStructs(`
        const squareArray: array<vec2f, 6> = array<vec2f, 6>(
            vec2f(-0.1, -0.1),
            vec2f(-0.1,  0.1),
            vec2f( 0.1, -0.1),
            vec2f( 0.1, -0.1),
            vec2f(-0.1,  0.1),
            vec2f( 0.1,  0.1)
        );
    `);

            return builder.buildVertexFragment(extractFunctionBody(vertexCode), extractFunctionBody(fragmentCode), attributes);
        }

        // Build vertex shader only
        return builder.buildVertex(userCode, attributes);
    }

    if (shaderType === 'fragment') {
        return builder.buildFragment(userCode);
    }

    throw new Error(`Unknown shader type: ${shaderType}`);
}
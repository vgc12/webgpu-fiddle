import {ShaderBuilder, type VertexAttribute} from "@/graphics/shader-builder.tsx";

/**
 * Creates a vertex + fragment shader pair for rendering particles
 * Users write fn main() for both stages
 *
 * @param vertexCode - The user's vertex shader code
 * @param fragmentCode - The user's fragment shader code
 * @returns Complete WGSL render shader code
 *
 * @example
 * ```typescript
 * const shader = createRenderShader(
 *   `fn main() {
 *     let size = 0.04;
 *     var offset = squareArray[vertexIndex] * size;
 *     let pos = particlePos + offset;
 *     output.position = vec4<f32>(pos, 0.0, 1.0);
 *     output.color = vec4<f32>(particleVel, 0.0, 1.0);
 *   }`,
 *   `fn main() { return color; }`
 * );
 * ```
 */
export function createRenderShader(vertexCode: string, fragmentCode: string): string {
    const builder = new ShaderBuilder();

    const attributes: VertexAttribute[] = [
        {location: 0, name: 'particlePos', type: 'vec2<f32>'},
        {location: 1, name: 'particleVel', type: 'vec2<f32>'},
    ];

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

    return builder.buildVertexFragment(vertexCode, fragmentCode, attributes);
}
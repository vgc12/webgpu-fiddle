import {ShaderBuilder} from "@/graphics/shader-builder.tsx";

/**
 * Creates a compute shader with standard particle struct and bindings
 * User writes fn main() with access to: global_id, local_id, workgroup_id
 *
 * @param userCode - The user's compute shader code
 * @returns Complete WGSL compute shader code
 *
 * @example
 * ```typescript
 * const shader = createComputeShader(`
 *   fn main() {
 *     let index = global_id.x;
 *     var particle = input[index];
 *     particle.velocity += vec2(0.0, -0.5) * 0.016;
 *     particle.position += particle.velocity * 0.016;
 *     output[index] = particle;
 *   }
 * `);
 * ```
 */
export function createComputeShader(userCode: string): string {
    const builder = new ShaderBuilder();

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

    return builder.buildCompute(userCode);
}
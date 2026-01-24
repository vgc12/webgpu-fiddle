/**
 * Defines a fragment shader output with its location and type
 */
export interface FragmentOutput {
    /** Output location (@location(N)) */
    location: number;
    /** WGSL type (e.g., 'vec4<f32>') */
    type: string;
}
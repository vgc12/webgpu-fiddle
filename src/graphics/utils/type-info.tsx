// AI was used to pull the proper size and alignments for each datatype from the WebGPU Spec.
/* eslint-disable @typescript-eslint/naming-convention */
// WGSL type sizes and alignments (following WebGPU spec)
export const TypeInfo: Record<string, { size: number; alignment: number }> = {
    'f32': {size: 4, alignment: 4},
    'i32': {size: 4, alignment: 4},
    'u32': {size: 4, alignment: 4},
    'f16': {size: 2, alignment: 2},

    'vec2<f32>': {size: 8, alignment: 8},
    'vec2<i32>': {size: 8, alignment: 8},
    'vec2<u32>': {size: 8, alignment: 8},
    'vec2f': {size: 8, alignment: 8},
    'vec2i': {size: 8, alignment: 8},
    'vec2u': {size: 8, alignment: 8},

    'vec3<f32>': {size: 12, alignment: 16},
    'vec3<i32>': {size: 12, alignment: 16},
    'vec3<u32>': {size: 12, alignment: 16},
    'vec3f': {size: 12, alignment: 16},
    'vec3i': {size: 12, alignment: 16},
    'vec3u': {size: 12, alignment: 16},

    'vec4<f32>': {size: 16, alignment: 16},
    'vec4<i32>': {size: 16, alignment: 16},
    'vec4<u32>': {size: 16, alignment: 16},
    'vec4f': {size: 16, alignment: 16},
    'vec4i': {size: 16, alignment: 16},
    'vec4u': {size: 16, alignment: 16},

    'mat2x2<f32>': {size: 16, alignment: 8},
    'mat2x2f': {size: 16, alignment: 8},
    'mat3x3<f32>': {size: 48, alignment: 16},
    'mat3x3f': {size: 48, alignment: 16},
    'mat4x4<f32>': {size: 64, alignment: 16},
    'mat4x4f': {size: 64, alignment: 16},
};
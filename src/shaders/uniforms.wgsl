struct Uniforms {
    resolution : vec2f,
    aspectRatio: f32,
    time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
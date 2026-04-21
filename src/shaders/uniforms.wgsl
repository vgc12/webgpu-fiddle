struct Uniforms {
    resolution : vec2f,
    mousePosition: vec2f,
    aspectRatio: f32,
    time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
// Global variables to hold uniform values for easy access in shaders
var<private> resolution: vec2f;
var<private> mousePosition: vec2f;
var<private> aspectRatio: f32;
var<private> time: f32;



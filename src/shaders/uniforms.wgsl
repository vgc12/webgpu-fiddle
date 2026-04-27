// Uniform buffer shared by all shaders. Uploaded from the CPU every frame.
struct Uniforms {
    resolution : vec2f,    // canvas width and height in pixels
    mousePosition: vec2f,  // cursor position in pixels (origin: top-left)
    aspectRatio: f32,      // resolution.x / resolution.y
    time: f32,             // seconds elapsed since the renderer started
    deltaTime: f32,        // seconds elapsed since the previous frame
}

// Bind the uniform buffer at group 0, binding 0 (reserved by the app)
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// Private copies of each uniform field so shaders can write just
// "resolution" instead of "uniforms.resolution". These are assigned
// automatically at the start of every entry point by the shader builder.
var<private> resolution: vec2f;
var<private> mousePosition: vec2f;
var<private> aspectRatio: f32;
var<private> time: f32;
var<private> deltaTime: f32;

struct Uniforms {
    resolution : vec2f,
    aspectRatio: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

const squareArray: array<vec2f, 6> = array<vec2f, 6>(
    vec2f(-0.1, -0.1),
    vec2f(-0.1,  0.1),
    vec2f( 0.1, -0.1),
    vec2f( 0.1, -0.1),
    vec2f(-0.1,  0.1),
    vec2f( 0.1,  0.1)
);

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @location(0) particlePos: vec2<f32>,
    @location(1) particleVel: vec2<f32>
) -> VertexOutput {
    var output: VertexOutput;
    
    let size = 0.04;
    var offset: vec2<f32> = squareArray[vertexIndex] * size;
    
    // Apply aspect ratio correction to x coordinate
    offset.x /= uniforms.aspectRatio;
    
    let pos = particlePos + offset;
    output.position = vec4<f32>(
        pos.x * 2.0 - 1.0,
        pos.y * 2.0 - 1.0,
        0.0,
        1.0
    );
    
    let speed = length(particleVel);
    output.color = vec4<f32>(1.0, 0.5 + speed * 50.0, 0.3, 1.0);
    
    return output;
}

@fragment
fn fragmentMain(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
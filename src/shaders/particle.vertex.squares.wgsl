const squareArray: array<vec2f, 6> = array<vec2f, 6>(
    vec2f(-0.1, -0.1),
    vec2f(-0.1,  0.1),
    vec2f( 0.1, -0.1),
    vec2f( 0.1, -0.1),
    vec2f(-0.1,  0.1),
    vec2f( 0.1,  0.1)
);
struct Particle {
  position: vec2<f32>,
  velocity: vec2<f32>,
}
@group(0) @binding(1) var<storage, read> input: array<Particle>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    var particle = input[instanceIndex];
    let particlePos = particle.position;
    let particleVel = particle.velocity;
    
    var output: VertexOutput;

    // Size in pixels (will be square regardless of aspect ratio)
    let sizeInPixels = 40.0; // 40 pixels
    
    // Convert particle position from 0-1 to pixel coordinates
    let posInPixels = particlePos * uniforms.resolution;
    
    // Offset is in pixels (naturally square)
    let offsetInPixels = squareArray[vertexIndex] * sizeInPixels;
    
    let finalPosInPixels = posInPixels + offsetInPixels;
    
    // Convert back to clip space (-1 to 1)
    output.position = vec4<f32>(
        (finalPosInPixels.x / uniforms.resolution.x) * 2.0 - 1.0,
        (finalPosInPixels.y / uniforms.resolution.y) * 2.0 - 1.0,
        0.0,
        1.0
    );

    let speed = length(particleVel);
    let vi = f32(vertexIndex) / 6.0;
    output.color = vec4<f32>(particlePos, vi, 1.0);

    return output;
}
struct Particle {
    position: vec2<f32>,
}

@group(0) @binding(1) var<storage, read> input: array<Particle>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

const squareArray: array<vec2f, 6> = array<vec2f, 6>(
    vec2f(-1, -1),
    vec2f(-1,  1),
    vec2f( 1, -1),
    vec2f(-1,  1),
    vec2f( 1,  1),
    vec2f( 1, -1),
);

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    var particle = input[instanceIndex];
    let particlePos = particle.position;

    let sizeInPixels = 4.0;

    let posInPixels = particlePos * resolution;
    let offsetInPixels = squareArray[vertexIndex] * sizeInPixels;
    let finalPosInPixels = posInPixels + offsetInPixels;

    var output: VertexOutput;
    output.position = vec4<f32>(
        (finalPosInPixels.x / resolution.x) * 2.0 - 1.0,
        (finalPosInPixels.y / resolution.y) * 2.0 - 1.0,
        0.0,
        1.0
    );
    output.color = vec4<f32>(particlePos, 0.5, 1.0);

    return output;
}

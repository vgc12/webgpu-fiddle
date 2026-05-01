// Must match the struct in the compute shader so the vertex shader
// can read particle data from the same buffer layout.
struct Particle {
    position: vec2<f32>,
}

// Input buffer: current particle positions (read by both compute and vertex stages)
@group(0) @binding(1) var<storage, read> input: array<Particle>;

// Data passed from vertex shader to fragment shader
struct VertexOutput {
    @builtin(position) position: vec4<f32>,    // clip-space position for the rasterizer
    @location(0) color: vec4<f32>,             // per-vertex color, interpolated across the quad
}

// 6 vertices forming a quad from 2 triangles.
// Each vertex is a corner offset in the range -1 to 1.
const squareArray: array<vec2f, 6> = array<vec2f, 6>(
    vec2f(-1, -1),    // triangle 1: bottom-left
    vec2f(-1,  1),    // triangle 1: top-left
    vec2f( 1, -1),    // triangle 1: bottom-right
    vec2f(-1,  1),    // triangle 2: top-left
    vec2f( 1,  1),    // triangle 2: top-right
    vec2f( 1, -1),    // triangle 2: bottom-right
);

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,        // which of the 6 quad vertices (0..5)
    @builtin(instance_index) instanceIndex: u32     // which particle instance
) -> VertexOutput {
    var particle = input[instanceIndex];             // read this particle's data from the buffer
    let particlePos = particle.position;             // position in 0..1 space

    let sizeInPixels = 4.0;                          // side length of each particle quad in pixels

    // Convert particle position from normalized 0..1 to pixel coordinates
    let posInPixels = particlePos * resolution;
    // Scale the quad corner offset (-1..1) to the desired pixel size
    let offsetInPixels = squareArray[vertexIndex] * sizeInPixels;
    // Final pixel position: particle center + quad corner offset
    let finalPosInPixels = posInPixels + offsetInPixels;

    var output: VertexOutput;
    // Convert from pixel space to clip space (-1 to 1)
    output.position = vec4<f32>(
        (finalPosInPixels.x / resolution.x) * 2.0 - 1.0,   // pixels -> clip x
        (finalPosInPixels.y / resolution.y) * 2.0 - 1.0,   // pixels -> clip y
        0.0,                                                 // no depth
        1.0                                                  // homogeneous w
    );
    // Color from position: red = x, green = y, blue = constant
    output.color = vec4<f32>(particlePos, 0.5, 1.0);

    return output;
}

// Three vertices forming a triangle much larger than clip space (-1 to 1).
// The GPU clips it to the viewport, guaranteeing every pixel is covered.
// This avoids the diagonal seam that two-triangle quads can produce.
const triangleVertices: array<vec2f, 3> = array<vec2f, 3>(
    vec2f(-5, -5),
    vec2f(0,  5),
    vec2f(5, -5),
);

// Output struct carrying the clip-space position to the rasterizer
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
}

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,       // which of the 3 vertices (0, 1, or 2)
    @builtin(instance_index) instanceIndex: u32     // always 0 for canvas templates
) -> VertexOutput {

    var output: VertexOutput;
    let v : vec2f = triangleVertices[vertexIndex];           // look up this vertex's 2D position
    output.position = vec4<f32>(
        v.x,   // clip-space x (far outside -1 -> 1, will be clipped)
        v.y,   // clip-space y
        0.0,   // depth (not used for full-screen effects)
        1.0    // w component (required for homogeneous coordinates)
    );
    return output;
}
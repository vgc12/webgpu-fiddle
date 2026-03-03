const triangleVertices: array<vec2f, 3> = array<vec2f, 3>(
    vec2f(-5, -5),
    vec2f(0,  5),
    vec2f(5, -5),
);

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
}

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {

    var output: VertexOutput;
    let v = triangleVertices[vertexIndex];
    output.position = vec4<f32>(
        v.x,
        v.y,
        0.0,
        1.0
    );
    return output;
}
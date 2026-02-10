const squareArray: array<vec2f, 6> = array<vec2f, 6>(
    vec2f(-1, -1),
    vec2f(-1,  1),
    vec2f( 1, -1),
    vec2f( 1, -1),
    vec2f(-1,  1),
    vec2f( 1,  1)
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
    let v = squareArray[vertexIndex];
    output.position = vec4<f32>(
        v.x,
        v.y,
        0.0,
        1.0
    );
    return output;
}
struct VertexOutput {
    @builtin(position) position: vec4<f32>,

}
@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {
    return fragCoord;
}
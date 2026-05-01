@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {
    return vec4f(0.0, 0.0, 0.0, 1.0);
}

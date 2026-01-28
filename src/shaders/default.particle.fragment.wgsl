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
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}


@fragment
fn fragmentMain(
    @location(0) color: vec4<f32>,
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {

    return color;

}
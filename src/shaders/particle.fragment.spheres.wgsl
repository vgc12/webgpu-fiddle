@fragment
fn fragmentMain(
    @location(0) color: vec4<f32>,
    @location(1) quadUV: vec2<f32>,
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {
    let d = length(quadUV);
    if (d > 1.0) { discard; }

    // soft shading on the sphere
    let normal = vec3f(quadUV, sqrt(1.0 - d * d));
    let light = normalize(vec3f(0.5, 0.7, 1.0));
    let diff = max(dot(normal, light), 0.0);
    let ambient = 0.15;
    let rim = pow(1.0 - normal.z, 3.0) * 0.4;

    let lit = color.rgb * (diff + ambient) + rim * color.rgb;
    return vec4f(lit, 1.0);
}

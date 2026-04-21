@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {
    let uv = (vec2f(fragCoord.x, resolution.y - fragCoord.y) * 2.0 - resolution) / resolution.y;
    let zoom = 1.5;
    var z = uv * zoom;

    // animate c along a path that produces interesting morphing shapes
    let t = time * 0.3;
    let c = vec2f(
        0.355 + 0.1 * sin(t * 0.7) + 0.05 * cos(t * 1.3),
        0.355 + 0.1 * cos(t * 0.9) + 0.05 * sin(t * 1.1)
    );

    var i = 0;
    let maxIter = 300;

    for (i = 0; i < maxIter; i++) {
        z = vec2f(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        if (dot(z, z) > 4.0) { break; }
    }

    if (i == maxIter) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    // smooth iteration count
    let sl = f32(i) - log2(log2(dot(z, z))) + 4.0;
    let n = sl / f32(maxIter);

    // color palette
    let col = 0.5 + 0.5 * cos(vec3f(3.0, 3.5, 4.0) + n * 6.2831 * 3.0);

    return vec4f(col, 1.0);
}

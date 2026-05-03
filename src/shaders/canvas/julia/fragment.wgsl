@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>     // pixel position of this fragment
) -> @location(0) vec4<f32> {
    // Map pixel coordinates to a centered UV space where y ranges from -1 to 1.
    // fragCoord.y is flipped so y increases upward (screen coords go downward).
    // Dividing by resolution.y keeps the aspect ratio correct.
    let uv = (vec2f(fragCoord.x, resolution.y - fragCoord.y) * 2.0 - resolution) / resolution.y;

    let zoom = 1.5; // scale factor controlling how much of the fractal is visible
var z = uv * zoom; // initial complex number z = pixel position in the complex plane

    // Animate the constant c along a smooth looping path through the complex plane.
    // Different c values produce dramatically different fractal patterns.
    let t = time * 0.3;
    let c = vec2f(
        0.355 + 0.1 * sin(t * 0.7) + 0.05 * cos(t * 1.3),   // real part
        0.355 + 0.1 * cos(t * 0.9) + 0.05 * sin(t * 1.1)     // imaginary part
    );

    var i = 0;
    let maxIter = 300; // iteration limit; points that survive this many are "in the set"

    // Iterate z = z^2 + c.
    // Complex squaring: (a+bi)^2 = (a^2 - b^2) + (2ab)i
    for (i = 0; i < maxIter; i++) {
        z = vec2f(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        // If |z|^2 > 4, the point has escaped to infinity (it will never come back)
        if (dot(z, z) > 4.0) { break; }
    }

    // Points that never escaped are part of the Julia set; color them black
    if (i == maxIter) {
        return vec4f(0.0, 0.0, 0.0, 1.0);
    }

    // Smooth iteration count: removes visible banding from raw integer iteration values.
    // log2(log2(|z|^2)) corrects for how far past the escape threshold z traveled.
    let sl = f32(i) - log2(log2(dot(z, z))) + 4.0;
    let n = sl / f32(maxIter); // normalize to 0..1 range

    // Cosine palette: cycles through hues smoothly based on the normalized iteration count.
    // The constants (3.0, 3.5, 4.0) offset each RGB channel for color variety.
    let col = 0.5 + 0.5 * cos(vec3f(3.0, 3.5, 4.0) + n * 6.2831 * 3.0);

    return vec4f(col, 1.0);
}

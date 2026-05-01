@fragment
fn fragmentMain(
    @location(0) color: vec4<f32>,
    @location(1) quadUV: vec2<f32>,
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {
    // Fade across the width (thin streak)
    let fadeX = 1.0 - smoothstep(0.3, 1.0, abs(quadUV.x));
    // Fade along the length (tapered tips, brighter at the leading edge)
    let fadeY = 1.0 - smoothstep(0.4, 1.0, abs(quadUV.y));
    let fade = fadeX * fadeY;

    // Since there's no alpha blending, multiply color by fade.
    // On a black background this looks identical to proper transparency.
    return vec4f(color.rgb * fade, 1.0);
}

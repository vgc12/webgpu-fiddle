@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>   // pixel position of this fragment (x, y in pixels, z = depth)
) -> @location(0) vec4<f32> {                 // output: color written to the first render target
    // Return the raw pixel coordinate as a color.
    // Red increases left-to-right, green increases top-to-bottom.
    // Values above 1.0 are clamped, so most of the screen appears yellow/white.
    // This is just a placeholder to confirm rendering works.
    return fragCoord;
}
@fragment
fn fragmentMain(
    @location(0) color: vec4<f32>,      // interpolated color from the vertex shader
) -> @location(0) vec4<f32> {           // output color for this pixel
    // Simple pass-through: every pixel in the quad gets the vertex color
    return color;
}

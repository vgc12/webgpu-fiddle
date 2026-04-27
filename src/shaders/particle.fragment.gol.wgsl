@fragment
fn fragmentMain(
    @location(0) color: vec4<f32>,      // flat color from the vertex shader (green or dark gray)
) -> @location(0) vec4<f32> {           // output color for this pixel
    // Pass-through: each cell is a solid color, no per-pixel computation needed
    return color;
}

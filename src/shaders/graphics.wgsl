struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @location(0) particlePos: vec2<f32>,
    @location(1) particleVel: vec2<f32>
) -> VertexOutput {
    var output: VertexOutput;
    
    // Define triangle vertices relative to particle position
    let size = 0.01; // Triangle size
    var offset: vec2<f32>;
    
    // Create a triangle pointing upward
    if (vertexIndex == 0u) {
        offset = vec2<f32>(0.0, size); // Top vertex
    } else if (vertexIndex == 1u) {
        offset = vec2<f32>(-size * 0.2, -size * 0.5); // Bottom left
    } else {
        offset = vec2<f32>(size * 0.2, -size * 0.5); // Bottom right
    }
    
    // Convert from [0,1] space to clip space [-1,1]
    let pos = particlePos + offset;
    output.position = vec4<f32>(
        pos.x * 2.0 - 1.0,
        pos.y * 2.0 - 1.0,
        0.0,
        1.0
    );
    
    // Color based on velocity
    let speed = length(particleVel);
    output.color = vec4<f32>(1.0, 0.5 + speed * 50.0, 0.3, 1.0);
    
    return output;
}

@fragment
fn fragmentMain(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}
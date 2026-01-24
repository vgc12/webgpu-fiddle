fn main() -> VertexOutput {
    var output: VertexOutput;
    
    let size = 0.04;
    var offset: vec2<f32> = squareArray[vertexIndex] * size;
    
    // Apply aspect ratio correction to x coordinate
    offset.x /= uniforms.aspectRatio;
    
    let pos = particlePos + offset;
    output.position = vec4<f32>(
        pos.x * 2.0 - 1.0,
        pos.y * 2.0 - 1.0,
        0.0,
        1.0
    );
    
    let speed = length(particleVel);
    let vi = f32(vertexIndex) / 6.0;
    output.color = vec4<f32>(particlePos,vi, 1.0);
    
    return output;
}


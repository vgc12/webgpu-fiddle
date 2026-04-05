struct Cell {
    state: u32,
}

@group(0) @binding(1) var<storage, read> input: array<Cell>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let gs = u32(sqrt(f32(arrayLength(&input))));
    let cellX = instanceIndex % gs;
    let cellY = instanceIndex / gs;

    // Use square cells sized to fit the smaller viewport dimension
    let minDim = min(resolution.x, resolution.y);
    let cellSize = minDim / f32(gs);

    // Center the grid in the viewport
    let offsetX = (resolution.x - f32(gs) * cellSize) * 0.5;
    let offsetY = (resolution.y - f32(gs) * cellSize) * 0.5;

    // Cell position in pixels
    let baseX = offsetX + f32(cellX) * cellSize;
    let baseY = offsetY + f32(cellY) * cellSize;

    // Quad from two triangles (6 vertices)
    var offsets = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 0.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 1.0),
    );

    let off = offsets[vertexIndex];
    let pixelPos = vec2<f32>(baseX + off.x * cellSize, baseY + off.y * cellSize);

    // Convert from pixel space to clip space (-1 to 1)
    let clipPos = vec2<f32>(
        pixelPos.x / resolution.x * 2.0 - 1.0,
        1.0 - pixelPos.y / resolution.y * 2.0,
    );

    let alive = input[instanceIndex].state == 1u;
    let color = select(
        vec4<f32>(0.05, 0.05, 0.08, 1.0),
        vec4<f32>(0.2, 0.9, 0.3, 1.0),
        alive
    );

    var out: VertexOutput;
    out.position = vec4<f32>(clipPos, 0.0, 1.0);
    out.color = color;
    return out;
}

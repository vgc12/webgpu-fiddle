// Must match the compute shader's struct
struct Cell {
    state: u32,
}

// Read cell states from the input buffer
@group(0) @binding(1) var<storage, read> input: array<Cell>;

// Data passed to the fragment shader
struct VertexOutput {
    @builtin(position) position: vec4<f32>,    // clip-space position
    @location(0) color: vec4<f32>,             // cell color (flat, same for all vertices of a cell)
}

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,        // which of the 6 quad vertices (0..5)
    @builtin(instance_index) instanceIndex: u32     // which cell (0 to gridSize^2 - 1)
) -> VertexOutput {
    // Derive the grid width from the total cell count
    let gs = u32(sqrt(f32(arrayLength(&input))));
    // Convert 1D instance index to 2D grid coordinates
    let cellX = instanceIndex % gs;                     // column
    let cellY = instanceIndex / gs;                     // row

    // Size each cell to fit the smaller viewport dimension (keeps cells square)
    let minDim = min(resolution.x, resolution.y);
    let cellSize = minDim / f32(gs);

    // Center the grid in the viewport (adds margin on the longer axis)
    let offsetX = (resolution.x - f32(gs) * cellSize) * 0.5;
    let offsetY = (resolution.y - f32(gs) * cellSize) * 0.5;

    // This cell's top-left corner in pixel coordinates
    let baseX = offsetX + f32(cellX) * cellSize;
    let baseY = offsetY + f32(cellY) * cellSize;

    // 6 vertices forming a quad from 2 triangles.
    // Offsets are 0 or 1, so the quad spans from (baseX, baseY) to (baseX+cellSize, baseY+cellSize).
    var offsets = array<vec2<f32>, 6>(
        vec2<f32>(0.0, 0.0),     // triangle 1: top-left
        vec2<f32>(1.0, 0.0),     // triangle 1: top-right
        vec2<f32>(0.0, 1.0),     // triangle 1: bottom-left
        vec2<f32>(1.0, 0.0),     // triangle 2: top-right
        vec2<f32>(1.0, 1.0),     // triangle 2: bottom-right
        vec2<f32>(0.0, 1.0),     // triangle 2: bottom-left
    );

    // Compute this vertex's pixel position
    let off = offsets[vertexIndex];
    let pixelPos = vec2<f32>(baseX + off.x * cellSize, baseY + off.y * cellSize);

    // Convert from pixel space to clip space (-1 to 1).
    // Y is flipped (1.0 - ...) because clip space Y points up but pixel Y points down.
    let clipPos = vec2<f32>(
        pixelPos.x / resolution.x * 2.0 - 1.0,
        1.0 - pixelPos.y / resolution.y * 2.0,
    );

    // Color based on cell state: green if alive, dark gray if dead.
    // select(falseVal, trueVal, condition) is WGSL's branchless ternary.
    let alive = input[instanceIndex].state == 1u;
    let color = select(
        vec4<f32>(0.05, 0.05, 0.08, 1.0),             // dead: near-black
        vec4<f32>(0.2, 0.9, 0.3, 1.0),                // alive: bright green
        alive
    );

    var out: VertexOutput;
    out.position = vec4<f32>(clipPos, 0.0, 1.0);
    out.color = color;
    return out;
}

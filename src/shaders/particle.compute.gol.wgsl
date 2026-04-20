struct Cell {
    state: u32,
}

@group(0) @binding(1) var<storage, read> input: array<Cell>;
@group(0) @binding(2) var<storage, read_write> output: array<Cell>;

fn gridSize() -> u32 {
    return u32(sqrt(f32(arrayLength(&input))));
}

fn getCell(x: i32, y: i32) -> u32 {
    let gs = i32(gridSize());
    let wx = ((x % gs) + gs) % gs;
    let wy = ((y % gs) + gs) % gs;
    return input[u32(wy) * gridSize() + u32(wx)].state;
}

@compute @workgroup_size(8, 8, 1)
fn computeMain(@builtin(global_invocation_id) id: vec3<u32>) {
    let gs = gridSize();
    if (id.x >= gs || id.y >= gs) {
        return;
    }

    let x = i32(id.x);
    let y = i32(id.y);

    // Count 8 neighbors

    let neighbors = getCell(x - 1, y - 1) + getCell(x, y - 1) + getCell(x + 1, y - 1)
                  + getCell(x - 1, y)                           + getCell(x + 1, y)
                  + getCell(x - 1, y + 1) + getCell(x, y + 1) + getCell(x + 1, y + 1);

    let current = getCell(x, y);
    let index = id.y * gs + id.x;

    // Conway's rules
    if (current == 1u) {
        output[index].state = select(0u, 1u, neighbors == 2u || neighbors == 3u);
    } else {
        output[index].state = select(0u, 1u, neighbors == 3u);
    }
}

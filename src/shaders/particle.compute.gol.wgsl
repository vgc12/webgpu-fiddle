// Each cell stores a single state: 1 = alive, 0 = dead
struct Cell {
    state: u32,
}

// Input buffer: cell states from the previous frame
@group(0) @binding(1) var<storage, read> input: array<Cell>;
// Output buffer: cell states for the next frame
@group(0) @binding(2) var<storage, read_write> output: array<Cell>;

// Derive the grid width from the total cell count.
// Assumes a square grid (e.g. 1048576 cells -> 1024x1024).
fn gridSize() -> u32 {
    return u32(sqrt(f32(arrayLength(&input))));
}

// Look up a cell's state with wrapping (toroidal topology).
// The double-modulo ((x % gs) + gs) % gs handles negative indices correctly,
// since WGSL's % can return negative values for negative inputs.
fn getCell(x: i32, y: i32) -> u32 {
    let gs = i32(gridSize());
    let wx = ((x % gs) + gs) % gs;                     // wrap x into [0, gs)
    let wy = ((y % gs) + gs) % gs;                     // wrap y into [0, gs)
    return input[u32(wy) * gridSize() + u32(wx)].state; // convert 2D coords to 1D buffer index
}

// 2D workgroup: 8x8 = 64 threads, matching the 2D grid structure
@compute @workgroup_size(8, 8, 1)
fn computeMain(@builtin(global_invocation_id) id: vec3<u32>) {
    let gs = gridSize();
    // Bounds check: dispatch may overshoot the grid dimensions
    if (id.x >= gs || id.y >= gs) {
        return;
    }

    let x = i32(id.x);
    let y = i32(id.y);

    // Count all 8 neighbors (Moore neighborhood)
    // Layout:
    //   (x-1,y-1) (x,y-1) (x+1,y-1)
    //   (x-1,y  )         (x+1,y  )
    //   (x-1,y+1) (x,y+1) (x+1,y+1)
    let neighbors = getCell(x - 1, y - 1) + getCell(x, y - 1) + getCell(x + 1, y - 1)
                  + getCell(x - 1, y)                           + getCell(x + 1, y)
                  + getCell(x - 1, y + 1) + getCell(x, y + 1) + getCell(x + 1, y + 1);

    let current = getCell(x, y);                        // this cell's current state
    let index = id.y * gs + id.x;                       // 1D index into the output buffer

    // Conway's Game of Life rules:
    // select(falseVal, trueVal, condition) is WGSL's branchless ternary
    if (current == 1u) {
        // Live cell survives with exactly 2 or 3 neighbors, dies otherwise
        output[index].state = select(0u, 1u, neighbors == 2u || neighbors == 3u);
    } else {
        // Dead cell comes alive with exactly 3 neighbors (reproduction)
        output[index].state = select(0u, 1u, neighbors == 3u);
    }
}

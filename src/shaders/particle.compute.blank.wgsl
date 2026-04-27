// Each particle has a single 2D position
struct Particle {
    position: vec2<f32>,
}

// Input buffer (read-only): particle state from the previous frame
@group(0) @binding(1) var<storage, read> input: array<Particle>;
// Output buffer (read-write): particle state for the next frame
@group(0) @binding(2) var<storage, read_write> output: array<Particle>;


// 64 threads per workgroup, 1D dispatch (one thread per particle)
@compute @workgroup_size(64, 1, 1)
fn computeMain(
    @builtin(global_invocation_id) global_id: vec3<u32>,    // unique index across all workgroups
    @builtin(local_invocation_id) local_id: vec3<u32>,      // index within this workgroup (0..63)
    @builtin(workgroup_id) workgroup_id: vec3<u32>          // which workgroup this thread belongs to
) {

        let index = global_id.x;

        // Bounds check: workgroup dispatch may launch more threads than particles
        if (index >= arrayLength(&input)) {
           return;
        }

        // Arrange particles in a grid.
        // Calculate grid dimensions: enough columns for a roughly square layout.
        let count = arrayLength(&input);
        let cols = u32(ceil(sqrt(f32(count))));   // e.g. 2500 particles -> 50 columns
        let row = index / cols;                    // integer division gives the row
        let col = index % cols;                    // remainder gives the column

        // Center each particle within its grid cell, normalized to 0..1 range
        let x = (f32(col) + 0.5) / f32(cols);
        let y = (f32(row) + 0.5) / f32(cols);

        output[index].position = vec2<f32>(x, y);

}
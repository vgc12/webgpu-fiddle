// Simple example: double each value in an array

struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
}

@group(0) @binding(0) var<storage, read> input: array<Particle>;
@group(0) @binding(1) var<storage, read_write> output: array<Particle>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;

    // Don't process beyond array length
    if (index >= arrayLength(&input)) {
        return;
    }

    // Read particle from input
    var particle = input[index];

    // Update particle (example: simple physics)
    particle.position = particle.position + particle.velocity * 0.016;

    // Write to output
    output[index] = particle;
}
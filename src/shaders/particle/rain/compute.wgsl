struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
}

@group(0) @binding(1) var<storage, read> input: array<Particle>;
@group(0) @binding(2) var<storage, read_write> output: array<Particle>;

// Deterministic hash from an integer, returns [0, 1)
fn hash(n: u32) -> f32 {
    return fract(sin(f32(n) * 78.233) * 43758.5453);
}

// Two-input hash so that index and time are mixed independently
fn hash2(a: u32, b: f32) -> f32 {
    return fract(sin(f32(a) * 127.1 + b * 311.7) * 43758.5453);
}

@compute @workgroup_size(64, 1, 1)
fn computeMain(
    @builtin(global_invocation_id) global_id: vec3<u32>,
) {
    let index = global_id.x;
    if (index >= arrayLength(&input)) { return; }

    var p = input[index];
    let dt = deltaTime;

    // Per-particle random properties seeded by index
    let r1 = hash(index * 3u + 1u);        // fall speed variation
    let r2 = hash(index * 7u + 3u);        // horizontal drift variation
    let r3 = hash(index * 13u + 5u);       // depth layer (affects speed and size)

    let layer = 0.3 + r3 * 0.7;            // 0.3 = far/slow, 1.0 = close/fast
    let fallSpeed = (.6 + r1 * .76) * layer;
    let drift = (r2 - 0.5) * 0.05;         // slight wind

    // Target velocity: falling with drift
    let baseVel = vec2f(drift, -fallSpeed);
    // Smoothly approach baseVel velocity (gives inertia after mouse push)
    p.velocity = mix(p.velocity, baseVel, 0.05);

    // Mouse repulsion: wind effect pushing drops away from cursor
    let mouse = vec2f(mousePosition.x / resolution.x, 1.0 - mousePosition.y / resolution.y);
    let diff = p.position - mouse;
    let dist = length(diff);
    let mouseRadius = 0.15;
    if (dist < mouseRadius && dist > 1e-4) {
        let strength = pow((mouseRadius - dist) / mouseRadius, 2.0);
        p.velocity += normalize(diff) * strength * 2.0 * layer;
    }

    p.position += p.velocity * dt;

    // Respawn above the top edge when falling off the bottom.
    // Stagger y so particles that respawn on the same frame
    // don't form a visible horizontal line.
    if (p.position.y < -0.02) {
        p.position.y = 1.02 + hash2(index, time + 17.3) * 0.3;
        p.position.x = hash2(index, time);
        p.velocity = baseVel;
    }

    // Wrap horizontally
    if (p.position.x < -0.05) { p.position.x += 1.1; }
    if (p.position.x > 1.05)  { p.position.x -= 1.1; }

    output[index] = p;
}

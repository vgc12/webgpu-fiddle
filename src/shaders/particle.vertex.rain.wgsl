struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
}

@group(0) @binding(1) var<storage, read> input: array<Particle>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) quadUV: vec2<f32>,
}

// Deterministic hash from an integer, returns [0, 1)
fn hash(n: u32) -> f32 {
    return fract(sin(f32(n) * 78.233) * 43758.5453);
}

const quadVerts: array<vec2f, 6> = array<vec2f, 6>(
    vec2f(-1, -1),
    vec2f(-1,  1),
    vec2f( 1, -1),
    vec2f(-1,  1),
    vec2f( 1,  1),
    vec2f( 1, -1),
);

@vertex
fn vertexMain(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
    let p = input[instanceIndex];
    let speed = length(p.velocity);

    // Per-particle depth layer (same hash as compute shader)
    let r3 = hash(instanceIndex * 13u + 5u);
    let layer = 0.3 + r3 * 0.7;

    // Streak dimensions scale with depth layer
    let width = 0.8 + layer * 0.7;
    let streakLen = max(speed * 50.0, 4.0) * layer;

    // Align quad with velocity direction
    var dir: vec2f;
    if (speed > 1e-4) {
        dir = p.velocity / speed;
    } else {
        dir = vec2f(0.0, -1.0);
    }
    let perp = vec2f(-dir.y, dir.x);

    // Stretch quad: x axis = perpendicular (width), y axis = velocity (length)
    let local = quadVerts[vertexIndex];
    let offset = perp * local.x * width + dir * local.y * streakLen;

    let posPixels = p.position * uniforms.resolution + offset;

    var out: VertexOutput;
    out.position = vec4f(
        (posPixels.x / uniforms.resolution.x) * 2.0 - 1.0,
        (posPixels.y / uniforms.resolution.y) * 2.0 - 1.0,
        0.0, 1.0
    );

    // Color: blue-white, brightness varies with depth layer
    let brightness = 0.3 + layer * 0.7;
    out.color = vec4f(
        0.55 * brightness,
        0.7 * brightness,
        brightness,
        brightness
    );
    out.quadUV = local;

    return out;
}

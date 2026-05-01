// Builds a 2D rotation matrix from an angle (radians).
// Used to rotate the camera ray direction based on mouse input.
fn rot2D(angle: f32) -> mat2x2<f32> {
    let s = sin(angle);
    let c = cos(angle);
    return mat2x2<f32>(c, -s, s, c);
}

// Pseudo-random hash: maps a float to a seemingly random float in [0, 1).
// Uses the classic sin-fract trick (not cryptographic, but fine for visuals).
fn rand(co: f32) -> f32 {
    return fract(sin(co * 91.3458) * 47453.5453);
}

// Credit to Inigo Quilez for SDF functions and operation functions
// https://iquilezles.org/articles/distfunctions/

// Smooth minimum: blends two SDF distances with a smooth transition
// instead of the hard crease you get from min(a, b).
// k controls the blend radius (larger k = wider blend).
fn smin(a: f32, b: f32, k: f32) -> f32 {
    let h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * h * k * (1.0 / 6.0);
}

// Signed distance to a capsule (line segment from a to b, thickened by radius r).
// Projects point p onto the segment, then measures distance to the surface.
fn sdCapsule(p: vec3f, a: vec3f, b: vec3f, r: f32) -> f32 {
    let pa = p - a;                                        // vector from segment start to point
    let ba = b - a;                                        // segment direction
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);   // projection parameter clamped to [0,1]
    return length(pa - ba * h) - r;                        // distance to nearest point on segment, minus radius
}

// Signed distance to a sphere centered at the origin.
fn sdSphere(p:vec3f, radius:f32) -> f32
{
    return length( p ) - radius;
}

// Signed distance to an axis-aligned box with half-extents b.
// abs(p) folds the point into the positive octant so only one corner needs checking.
fn sdBox(p: vec3f, b: vec3f) -> f32 {
    let q = abs(p) - b;                                                // distance from each face
    return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);  // outside + inside correction
}

// 3D pseudo-random hash. Maps a vec3 to a float in [0, 1).
fn rand3(co: vec3f) -> f32 {
    return fract(sin(dot(co, vec3f(12.9898, 78.233, 45.164))) * 43758.5453);
}

// Determines a sphere's travel speed from its grid cell.
// Returns 0 for cells where no sphere spawns (40% chance).
fn randSpeed(seedCell: vec3f) -> f32 {
    let r = rand3(seedCell);
    if (r > 0.9) { return 2.5; }       // fast (10% chance)
    else if (r > 0.5) { return 1.5; }  // medium (40% chance)
    else if (r > 0.3) { return 0.6; }  // slow (20% chance)
    return 0.0;                         // no sphere (30% chance)
}

// Computes a moving sphere along one axis of the pipe grid.
// pAxis: world position along the movement axis
// qAxis: repeated local coord along that axis (from fract)
// crossQ: the two local coords perpendicular to movement
// speedCell: grid cell with movement axis zeroed (seeds the speed RNG)
// spawnSeed: offset to decorrelate spawn checks between axes
// Returns vec2f(distance, materialID) where materialID=1 means sphere.
fn axisSphere(pAxis: f32, qAxis: f32, crossQ: vec2f, speedCell: vec3f, spawnSeed: vec3f) -> vec2f {
    let speed = randSpeed(speedCell);
    if (speed == 0.0) { return vec2f(1e10, 0.0); }   // no sphere in this cell

    let moved = pAxis - time * speed;                  // offset position by time to animate movement
    let movedCell = floor(moved / 2.0);                // which repetition cell the sphere is in
    let sq = fract(moved / 2.0) * 2.0 - 1.0;          // local position within the cell (-1 to 1)

    // Random spawn check per moving cell (some cells have no sphere)
    let r = rand3(vec3f(speedCell.x + movedCell, speedCell.y, speedCell.z) + spawnSeed);
    if (r < 0.3) { return vec2f(1e10, 0.0); }         // 30% chance: skip this sphere

    // Place a sphere at the cell center, radius 0.4
    return vec2f(sdSphere(vec3f(crossQ.x, sq, crossQ.y), .4f), 1.0);
}

// Blends a sphere SDF into the running scene result using smin.
// Tracks material blend: as the sphere gets closer, material approaches 1.
fn blendSphere(result: vec2f, sd: vec2f) -> vec2f {
    if (sd.y == 0.0) { return result; }                // no sphere, skip
    let blended = smin(sd.x, result.x, .4f);           // smooth-min the distances
    let blend = clamp((result.x - sd.x) / 0.8, 0.0, 1.0);  // interpolation weight for material
    return vec2f(blended, max(result.y, blend));
}

// Full scene SDF. Returns vec2f(distance, materialID) where 0=pipes, 1=sphere.
fn scene(p: vec3f) -> vec2f {
    let q = fract(p / 2.0) * 2.0 - 1.0;               // infinite repetition: map p into a local cell (-1 to 1)

    // Start with a box at each grid junction
    var d = sdBox(q, vec3f(0.5));
    // Smooth-blend capsules along each axis to form the pipes
    d = smin(sdCapsule(q,vec3f(-1,0,0),vec3f(1,0,0),.3f), d, .4);    // X-axis pipe
    d = smin(sdCapsule(q,vec3f(0,0,-1), vec3f(0,0,1), .3f), d, .4f);  // Z-axis pipe
    d = smin(sdCapsule(q,vec3f(0,-1,0), vec3f(0,1,0),.3f), d, .4f);   // Y-axis pipe

    var result = vec2f(d, 0.0);                         // pipes have material 0
    let cell = floor(p / 2.0);                          // which grid cell we're in

    // Add spheres traveling along the Y axis
    let sy = axisSphere(p.y, q.y, vec2f(q.x, q.z),
        vec3f(cell.x, 0.0, cell.z), vec3f(0.0));
    result = blendSphere(result, sy);

    // Add spheres traveling along the X axis (offset seeds to decorrelate from Y)
    let sx = axisSphere(p.x, q.x, vec2f(q.y, q.z),
        vec3f(0.0, cell.y, cell.z) + vec3f(7.13), vec3f(3.7));
    result = blendSphere(result, sx);

    // Z-axis spheres (commented out to reduce visual clutter)
/*    let sz = axisSphere(p.z, q.z, vec2f(q.x, q.y),
        vec3f(cell.x, cell.y, 0.0) + vec3f(13.37), vec3f(5.19));
    result = blendSphere(result, sz);*/

    return result;
}

// Distance-only wrapper for the ray marcher (ignores material)
fn sceneD(p: vec3f) -> f32 {
    return scene(p).x;
}

// Estimate the surface normal at point p using central differences.
// Samples the SDF at 6 nearby points to approximate the gradient.
fn getNormal(p: vec3f) -> vec3f {
    let e = vec2f(0.01, 0.0);                          // small offset for numerical differentiation
    return normalize(vec3f(
        sceneD(p + e.xyy) - sceneD(p - e.xyy),         // partial derivative along x
        sceneD(p + e.yxy) - sceneD(p - e.yxy),         // partial derivative along y
        sceneD(p + e.yyx) - sceneD(p - e.yyx)          // partial derivative along z
    ));
}

// Compute final shading for a surface point p seen from ray direction rd.
fn calcShading(p: vec3f, rd: vec3f) -> vec3f {
    let normal = getNormal(p);
    let mate = scene(p).y;                              // material blend: 0 = pipe, 1 = sphere

    // Pipe color: derived from normalized position (creates a rainbow gradient across the grid)
    let pipeColor = abs(normalize(p-vec3f(0)));
    // Sphere color: bright cyan/teal
    let sphereColor = vec3f(0.1, 0.85, 0.95);
    // Blend between pipe and sphere color based on material ID
    let baseColor = mix(pipeColor, sphereColor, mate);

    // Key light: warm, orbits around the Y axis
    let light_radius = 3.0;
    let lp1 = vec3f(cos(time) * light_radius, 0.0, sin(time) * light_radius);  // light position
    let ld1 = normalize(lp1 - p);                      // direction from surface to light
    let diff1 = clamp(dot(normal, ld1), 0.0, 1.0);     // Lambertian diffuse
    let att1 = 1.0 / (1.0 + 0.1 * length(lp1 - p) * length(lp1 - p));  // inverse-square falloff
    let warmLight = vec3f(1.0, 0.9, 0.7) * diff1 * att1 * 1.8;

    // Fill light: cool, orbits from the opposite side
    let lp2 = vec3f(-cos(time * 0.7) * 2.0, 2.0, -sin(time * 0.7) * 2.0);
    let ld2 = normalize(lp2 - p);
    let diff2 = clamp(dot(normal, ld2), 0.0, 1.0);
    let att2 = 1.0 / (1.0 + 0.15 * length(lp2 - p) * length(lp2 - p));
    let coolLight = vec3f(0.3, 0.5, 0.9) * diff2 * att2 * 0.8;

    // Specular highlight: reflects the key light off the surface toward the camera
    let refl = reflect(rd, normal);                     // reflection of view ray around the normal
    let spec = pow(clamp(dot(refl, ld1), 0.0, 1.0), 32.0) * att1;  // Phong specular, exponent 32
    // Specular tint: warm on pipes, cool on spheres
    let specColor = mix(vec3f(1.0, 0.8, 0.5), vec3f(0.6, 0.95, 1.0), mate) * spec * 0.6;

    // Constant ambient light to prevent fully black shadows
    let ambient = vec3f(0.06, 0.04, 0.1);

    // Extra glow on sphere surfaces (emissive term, not affected by lighting)
    let emissive = sphereColor * mate * 0.3;

    return baseColor * (warmLight + coolLight + ambient) + specColor + emissive;
}

@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>             // pixel position in screen space
) -> @location(0) vec4<f32> {

    // Convert pixel coords to centered UV space, y flipped, aspect-correct
    var uv: vec2f = (vec2f(fragCoord.x, resolution.y - fragCoord.y) * 2.0 - resolution.xy) / resolution.y;
    // Map mouse position to the same coordinate space
    var m : vec2f = (mousePosition * 2. - resolution.xy)/resolution.y;

    let fov : f32 = 1.5;                                // field of view (higher = wider)
    var ro : vec3f = vec3f(0);                           // ray origin (camera at world origin)
    var rd : vec3f = normalize(vec3f(uv*fov,1.));        // ray direction (uv determines angle, z=1 is forward)

    // Rotate ray direction by mouse Y (vertical orbit around X axis)
    let r = rot2D(-m.y);
    rd = vec3f(rd.x, r * rd.yz);

    // Rotate ray direction by mouse X (horizontal orbit around Y axis)
    let r2 = rot2D(m.x);
    rd = vec3f(r2 * rd.xz, rd.y).xzy;                   // swizzle to rotate in the XZ plane

    var col : vec3f = vec3f(0);

    var t : f32 = 0.;                                    // total distance traveled along the ray
    var i : i32 = 0;                                     // iteration counter (reused for AO)

    // Ray marching loop: step along the ray by the SDF distance at each point
    var p : vec3f = ro + rd * t;
    for(i = 0; i < 80; i++){                             // 80 max steps
        p = ro + rd * t;                                 // current point along the ray
        let d : f32 = sceneD(p);                         // distance to nearest surface
        if(d < .001 || t > 100.) { break; }              // hit (< 0.001) or miss (> 100 units away)
        t += d;                                          // advance by that distance (sphere tracing)
    }

    // Fog: objects further away fade toward the background
    let fogDist = 40.0;
    let fog = 1.0 - clamp(t / fogDist, 0.0, 1.0);       // 1.0 at camera, 0.0 at fogDist

    // Background: vertical gradient from deep purple (bottom) to darker purple (top)
    let bgTop = vec3f(0.02, 0.01, 0.08);
    let bgBot = vec3f(0.08, 0.03, 0.12);
    let bgCol = mix(bgBot, bgTop, uv.y * 0.5 + 0.5);

    if (t < 100.) {
        // Approximate ambient occlusion from iteration count:
        // more steps means the ray was navigating tight geometry
        let ao = 1.0 - f32(i) / 80.0;
        col = calcShading(p, rd) * ao;
        // Blend shaded color with background using fog factor
        col = mix(bgCol, col, fog);
        return vec4f(col, 1.0);
    }

    // Ray missed everything, show background
    return vec4f(bgCol, 1.0);
}
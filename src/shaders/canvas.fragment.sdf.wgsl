fn rot2D(angle: f32) -> mat2x2<f32> {
    let s = sin(angle);
    let c = cos(angle);
    return mat2x2<f32>(c, -s, s, c);
}

fn rand(co: f32) -> f32 {
    return fract(sin(co * 91.3458) * 47453.5453);
}

fn smin(a: f32, b: f32, k: f32) -> f32 {
    let h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * h * k * (1.0 / 6.0);
}

fn sdCapsule(p: vec3f, a: vec3f, b: vec3f, r: f32) -> f32 {
    let pa = p - a;
    let ba = b - a;
    let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}
fn sdfSphere(p:vec3f, radius:f32) -> f32
{
    return length( p ) - radius;
}

fn sdfBox(p: vec3f, b: vec3f) -> f32 {
    let q = abs(p) - b;
    return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

fn rand3(co: vec3f) -> f32 {
    return fract(sin(dot(co, vec3f(12.9898, 78.233, 45.164))) * 43758.5453);
}

fn randSpeed(seedCell: vec3f) -> f32 {
    let r = rand3(seedCell);
    if (r > 0.9) { return 2.5; }
    else if (r > 0.5) { return 1.5; }
    else if (r > 0.3) { return 0.6; }
    return 0.0;
}

// computes a moving sphere along one axis
// pAxis: world pos along movement axis, qAxis: local repeated coord along that axis
// crossQ: the two local coords perpendicular to movement
// speedCell: cell with movement axis zeroed (for speed seed)
// spawnSeed: offset to make spawn random independent per axis
fn axisSphere(pAxis: f32, qAxis: f32, crossQ: vec2f, speedCell: vec3f, spawnSeed: vec3f) -> vec2f {
    let speed = randSpeed(speedCell);
    if (speed == 0.0) { return vec2f(1e10, 0.0); }

    let moved = pAxis - time * speed;
    let movedCell = floor(moved / 2.0);
    let sq = fract(moved / 2.0) * 2.0 - 1.0;

    // build sphere cell for spawn check (replace movement axis with movedCell)
    let r = rand3(vec3f(speedCell.x + movedCell, speedCell.y, speedCell.z) + spawnSeed);
    if (r < 0.3) { return vec2f(1e10, 0.0); }

    return vec2f(sdfSphere(vec3f(crossQ.x, sq, crossQ.y), .4f), 1.0);
}

fn blendSphere(result: vec2f, sd: vec2f) -> vec2f {
    if (sd.y == 0.0) { return result; }
    let blended = smin(sd.x, result.x, .4f);
    let blend = clamp((result.x - sd.x) / 0.8, 0.0, 1.0);
    return vec2f(blended, max(result.y, blend));
}

// returns vec2f(distance, materialID) where 0=pipes, 1=sphere
fn scene(p: vec3f) -> vec2f {
    let q = fract(p / 2.0) * 2.0 - 1.0;
    var d = sdfBox(q, vec3f(0.5));
    d = smin(sdCapsule(q,vec3f(-1,0,0),vec3f(1,0,0),.3f), d, .4);
    d = smin(sdCapsule(q,vec3f(0,0,-1), vec3f(0,0,1), .3f), d, .4f);
    d = smin(sdCapsule(q,vec3f(0,-1,0), vec3f(0,1,0),.3f), d, .4f);

    var result = vec2f(d, 0.0);
    let cell = floor(p / 2.0);

    // Y-axis spheres
    let sy = axisSphere(p.y, q.y, vec2f(q.x, q.z),
        vec3f(cell.x, 0.0, cell.z), vec3f(0.0));
    result = blendSphere(result, sy);

    // X-axis spheres
    let sx = axisSphere(p.x, q.x, vec2f(q.y, q.z),
        vec3f(0.0, cell.y, cell.z) + vec3f(7.13), vec3f(3.7));
    result = blendSphere(result, sx);

    // Z-axis spheres
/*    let sz = axisSphere(p.z, q.z, vec2f(q.x, q.y),
        vec3f(cell.x, cell.y, 0.0) + vec3f(13.37), vec3f(5.19));
    result = blendSphere(result, sz);*/

    return result;
}

fn sceneD(p: vec3f) -> f32 {
    return scene(p).x;
}

fn getNormal(p: vec3f) -> vec3f {
    let e = vec2f(0.01, 0.0);
    return normalize(vec3f(
        sceneD(p + e.xyy) - sceneD(p - e.xyy),
        sceneD(p + e.yxy) - sceneD(p - e.yxy),
        sceneD(p + e.yyx) - sceneD(p - e.yyx)
    ));
}

fn calcShading(p: vec3f, rd: vec3f) -> vec3f {
    let normal = getNormal(p);
    let mate = scene(p).y;

    // two-tone pipe color: warm copper base
    let pipeColor = abs(normalize(p-vec3f(0)));
    // sphere color: bright cyan/teal emissive
    let sphereColor = vec3f(0.1, 0.85, 0.95);
    let baseColor = mix(pipeColor, sphereColor, mate);

    // orbiting key light (warm)
    let light_radius = 3.0;
    let lp1 = vec3f(cos(time) * light_radius, 0.0, sin(time) * light_radius);
    let ld1 = normalize(lp1 - p);
    let diff1 = clamp(dot(normal, ld1), 0.0, 1.0);
    let att1 = 1.0 / (1.0 + 0.1 * length(lp1 - p) * length(lp1 - p));
    let warmLight = vec3f(1.0, 0.9, 0.7) * diff1 * att1 * 1.8;

    // fill light from opposite side (cool)
    let lp2 = vec3f(-cos(time * 0.7) * 2.0, 2.0, -sin(time * 0.7) * 2.0);
    let ld2 = normalize(lp2 - p);
    let diff2 = clamp(dot(normal, ld2), 0.0, 1.0);
    let att2 = 1.0 / (1.0 + 0.15 * length(lp2 - p) * length(lp2 - p));
    let coolLight = vec3f(0.3, 0.5, 0.9) * diff2 * att2 * 0.8;

    // specular highlight
    let refl = reflect(rd, normal);
    let spec = pow(clamp(dot(refl, ld1), 0.0, 1.0), 32.0) * att1;
    let specColor = mix(vec3f(1.0, 0.8, 0.5), vec3f(0.6, 0.95, 1.0), mate) * spec * 0.6;

    // ambient
    let ambient = vec3f(0.06, 0.04, 0.1);

    // sphere glow: add emissive on spheres
    let emissive = sphereColor * mate * 0.3;

    return baseColor * (warmLight + coolLight + ambient) + specColor + emissive;
}

@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {

    var uv: vec2f = (vec2f(fragCoord.x, resolution.y - fragCoord.y) * 2.0 - resolution.xy) / resolution.y;
    var m : vec2f = (mousePosition * 2. - resolution.xy)/resolution.y;

    let fov : f32 = 1.5;
    var ro : vec3f = vec3f(0);
    var rd : vec3f = normalize(vec3f(uv*fov,1.));
    
    let r = rot2D(-m.y);
    rd = vec3f(rd.x, r * rd.yz);

    let r2 = rot2D(m.x);
    rd = vec3f(r2 * rd.xz, rd.y).xzy;

    var col : vec3f = vec3f(0);

    var t : f32 = 0.;
    var i : i32 = 0;

    var p : vec3f = ro + rd * t;
    for(i = 0; i < 80; i++){
        p = ro + rd * t;
        let d : f32 = sceneD(p);
        t += d;
        if(d < .001 || t > 100.) { break; }
    }

    // depth fog factor
    let fogDist = 40.0;
    let fog = 1.0 - clamp(t / fogDist, 0.0, 1.0);

    // background: deep blue-purple gradient
    let bgTop = vec3f(0.02, 0.01, 0.08);
    let bgBot = vec3f(0.08, 0.03, 0.12);
    let bgCol = mix(bgBot, bgTop, uv.y * 0.5 + 0.5);
    //let bgCol =
    if (t < 100.) {
        // AO from iteration count
        let ao = 1.0 - f32(i) / 80.0;
        col = calcShading(p, rd) * ao;
        // fog blend into background
        col = mix(bgCol, col, fog);
        return vec4f(col, 1.0);
    }

    return vec4f(bgCol, 1.0);
}
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

fn scene(p: vec3f) -> f32 {
   // let capsule = sdCapsule(p, vec3f(0, -1, 0), vec3f(0, 1, 0), 0.5);
    let q = fract(p / 2.0) * 2.0 - 1.0;
    let cube = sdfBox(q, vec3f(0.5));
    var capsule = sdCapsule(q,vec3f(-1,0,0),vec3f(1,0,0), .3f);
    let capsule2 = sdCapsule(q,vec3f(0,0,-1), vec3f(0,0,1), .3f) ;
    let capsule3 = sdCapsule(q,vec3f(0,-1,0), vec3f(0,1,0),.3f);
    return smin(capsule3,smin(capsule2,smin(cube,capsule,.4f),.4f),.4f);
}

fn getNormal(p: vec3f) -> vec3f {
    let e = vec2f(0.01, 0.0);
    return normalize(vec3f(
        scene(p + e.xyy) - scene(p - e.xyy),
        scene(p + e.yxy) - scene(p - e.yxy),
        scene(p + e.yyx) - scene(p - e.yyx)
    ));
}

fn calcShading(p: vec3f) -> f32 {
    let light_radius = 3.0;
    let light_position = vec3f(cos(time) * light_radius, 0.0, sin(time) * light_radius);
    let light_dir = normalize(light_position - p);
    let normal = getNormal(p);
    let diff = clamp(dot(normal, light_dir), 0.0, 1.0);
    let dist = length(light_position - p);
    let intensity = 1.6;
    let attenuation = 1.0 / (1.0 + 0.1 * dist * dist);
    return diff * attenuation * intensity;
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

    var t : f32 = 0.; // total raymarch distance
    var i : i32 = 0; // iteration count

    var p : vec3f = ro + rd *t;
    var hit : bool = false;
    for(i = 0; i < 80; i++){
        p = ro + rd * t;

        let d : f32 = scene(p);

        col = vec3f(f32(i))/80.;
        hit = d * d < 1e-6;
        if(d < .001 || t > 100.)
        {
            break;
        }

        t += d;
    }
  
    col = vec3f(1,0,0);

    if (t < 100.)
    {
           var light : f32 = calcShading(p);
           return vec4f(vec3f(light*col),1.);
    }
    return vec4f(.5 + .5 * cos(time * vec3f(.2,.3,.5)), 1.0);

  
}
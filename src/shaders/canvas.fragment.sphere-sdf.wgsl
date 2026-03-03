// Available variables in your main() function:
// color: vec4<f32> - Input color from vertex shader
// fragCoord: vec4<f32> - Fragment coordinates
// Return: vec4<f32> - Output color for this fragment


// Available uniform variables in your shader:
// resolution: vec2<f32> - The resolution of the output (width, height)
// mousePosition: vec2<f32> - The position of the mouse (width, height)
// aspectRatio: f32 - The aspect ratio of the output (width / height)
// time: f32 - The elapsed time in seconds since the start of the program


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

fn sdCone(p: vec3f, a: vec3f, b: vec3f, ra: f32, rb: f32) -> f32 {
    let rba = rb - ra;
    let baba = dot(b - a, b - a);
    let papa = dot(p - a, p - a);
    let paba = dot(p - a, b - a) / baba;

    let x = sqrt(papa - paba * paba * baba);

    let cax = max(0.0, x - select(rb, ra, paba < 0.5));
    let cay = abs(paba - 0.5) - 0.5;

    let k = rba * rba + baba;
    let f = clamp((rba * (x - ra) + paba * baba) / k, 0.0, 1.0);

    let cbx = x - ra - f * rba;
    let cby = paba - f;

    let s = select(1.0, -1.0, cbx < 0.0 && cay < 0.0);

    return s * sqrt(min(cax * cax + cay * cay * baba,
                        cbx * cbx + cby * cby * baba));
}


fn GetMinSceneDistanceFromPoint(p: vec3f) -> f32 {
    //define sphere here for now vec4(position.xyz, radius)
    let sphere : vec4f = vec4f(0.0, 1.0, 6.0, 1.0);
    
    // get distance from point to sphere
    return length(p - sphere.xyz) - sphere.w;
}

fn calcShading(p : vec3f) -> f32
{
    // light source
    let light_position = vec3f(10, 5.0, 0);
    
    // light direction
    let light_dir = normalize(light_position - p);
    
    // calculate hitpoint normal (gradient of sdf at p)
    let dist = GetMinSceneDistanceFromPoint(p);
    let epsilon = vec2f(0.01,0);
    let normal = normalize(dist - vec3(GetMinSceneDistanceFromPoint(p - epsilon.xyy), 
                                        GetMinSceneDistanceFromPoint(p - epsilon.yxy), 
                                        GetMinSceneDistanceFromPoint(p - epsilon.yyx)));
    
    // calculate diffuse contribution
    return clamp(dot(normal, light_dir) , 0.0, 1.0);
}


fn map(p: vec3f) -> f32 {
   
    var ground = p.y+.75;
    var d = 1e10;
  
    var pos =vec3(0.,0,-1);
    
   // var cone = sdCone(p-pos, vec3(0,-1,0), vec3(0,10,0),20., 3. );
    //d = smin(d,cone,5.);
    d = GetMinSceneDistanceFromPoint(p-pos);
    //d = smin(ground, d,5.);
    return d;

}




@fragment
fn fragmentMain(
    @builtin(position) fragCoord: vec4<f32>
) -> @location(0) vec4<f32> {

    var uv: vec2f = (vec2f(fragCoord.x, resolution.y - fragCoord.y) * 2.0 - resolution.xy) / resolution.y;
   // var m : vec2f = (iMouse.xy * 2. - iResolution.xy)/iResolution.y;

    let fov : f32 = 1.5;
    var ro : vec3f = vec3f(0);
    var rd : vec3f = normalize(vec3f(uv*fov,1.));

/*
    ro.yz *= rot2D(-m.y);
    rd.yz *= rot2D(-m.y);

    ro.xz *= rot2D(-m.x);
    rd.xz *= rot2D(-m.x);
*/
    var col : vec3f = vec3f(0);

    var t : f32 = 0.; // total raymarch distance
    var i : i32 = 0; // iteration count

    var p : vec3f = ro + rd *t;
    var hit : bool = false;
    for(i = 0; i < 80; i++){
        p = ro + rd * t;

        let d : f32 = map(p);

        t += d;

        col = vec3f(f32(i))/80.;
        hit = d * d < 1e-6;
        if(d < .001 || t > 100.)
        {
            break;
        }
    }
  
    col = vec3f(1,0,0);

    if (t < 100.)
    {
           var light : f32 = calcShading(p);
           return vec4f(vec3f(light*col),1.);
    }
    return vec4f(uv.xy, 1.0, 1.0);

  
}
struct Particle {
    position: vec2<f32>,
}
  
@group(0) @binding(1) var<storage, read> input: array<Particle>;
@group(0) @binding(2) var<storage, read_write> output: array<Particle>;
  

@compute @workgroup_size(64, 1, 1)
fn computeMain(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(workgroup_id) workgroup_id: vec3<u32>
) {

        let index = global_id.x;
        
        if (index >= arrayLength(&input)) {
           return;
        } 
        
        let count = arrayLength(&input);
        let cols = u32(ceil(sqrt(f32(count))));
        let row = index / cols;
        let col = index % cols;

        let x = (f32(col) + 0.5) / f32(cols);
        let y = (f32(row) + 0.5) / f32(cols);

        output[index].position = vec2<f32>(x, y);

}
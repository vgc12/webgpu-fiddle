struct Particle {
    position: vec2<f32>,
    velocity: vec2<f32>,
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
        
        var particle = input[index];
        
        let dt = 0.016; // ~60fps
        let gravity = vec2<f32>(0.0, -0.5); // Downward gravity
        
         for (var i = 0u; i < arrayLength(&input); i++) {
               if (i == index) {
                   continue;
               }
           
               let other = input[i];
               let diff = particle.position - other.position;
               let dist = length(diff);
               let minDist = 0.01; // Particle radius * 2
           
               // If overlapping, push apart and bounce
               if (dist < minDist && dist > 0.0001) {
                   let normal = normalize(diff);
                   let overlap = minDist - dist;
               
                   // Push apart
                   particle.position += normal * overlap * 0.5;
               
                   // Bounce (simplified elastic collision)
                   let relVel = particle.velocity - other.velocity;
                   let velAlongNormal = dot(relVel, normal);
               
                   if (velAlongNormal < 0.0) {
                       particle.velocity -= normal * velAlongNormal * 1.0; // 1.0 = elastic
                   }
               }
           }
        
        // Apply gravity to velocity
        particle.velocity = particle.velocity + gravity * dt;
        
        // Update position
        particle.position = particle.position + particle.velocity * dt;
        
        // Bounce off bottom
        if (particle.position.y < 0.0) {
           particle.position.y = 0.0;
           particle.velocity.y = -particle.velocity.y * 1.0; // 80% energy retained
        }
        
        // Bounce off top
        if (particle.position.y > 1.0) {
           particle.position.y = 1.0;
           particle.velocity.y = -particle.velocity.y * 1.0;
        }
        
        // Bounce off left
        if (particle.position.x < 0.0) {
           particle.position.x = 0.0;
           particle.velocity.x = -particle.velocity.x * 1.0;
        }
        
        // Bounce off right
        if (particle.position.x > 1.0) {
           particle.position.x = 1.0;
           particle.velocity.x = -particle.velocity.x * 1.0;
        }
        
        output[index] = particle;

}
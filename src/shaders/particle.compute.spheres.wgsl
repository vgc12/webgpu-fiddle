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

        let dt = 0.016;
        let gravity = vec2<f32>(0.0, -0.5);

        // match visual radius: 15px sphere on a canvas of resolution.y height
        let radius = 15.0 / resolution.y;
        let minDist = radius * 2.0;
        let restitution = 0.8;

        // collision pass
        var posCorrection = vec2f(0.0);
        var velCorrection = vec2f(0.0);
        var collisionCount = 0.0;

        for (var i = 0u; i < arrayLength(&input); i++) {
            if (i == index) { continue; }

            let other = input[i];
            let diff = particle.position - other.position;
            let dist2 = dot(diff, diff);

            if (dist2 < minDist * minDist && dist2 > 1e-8) {
                let dist = sqrt(dist2);
                let normal = diff / dist;
                let overlap = minDist - dist;

                posCorrection += normal * overlap * 0.5;

                let relVel = particle.velocity - other.velocity;
                let velAlongNormal = dot(relVel, normal);

                if (velAlongNormal < 0.0) {
                    velCorrection -= normal * velAlongNormal;
                }
                collisionCount += 1.0;
            }
        }

        if (collisionCount > 0.0) {
            particle.position += posCorrection / collisionCount;
            particle.velocity += velCorrection / collisionCount * restitution;
        }

        // mouse repulsion
        let mouse = vec2f(mousePosition.x / resolution.x, 1.0 - mousePosition.y / resolution.y);
        let mouseDiff = particle.position - mouse;
        let mouseDist = length(mouseDiff);
        let mouseRadius = 0.1;
        if (mouseDist < mouseRadius && mouseDist > 1e-4) {
            let strength = (mouseRadius - mouseDist) / mouseRadius;
            particle.velocity += normalize(mouseDiff) * strength * 2.0;
        }

        particle.velocity += gravity * dt;
        particle.position += particle.velocity * dt;

        // wall bounces
        if (particle.position.y < radius) {
            particle.position.y = radius;
            particle.velocity.y = -particle.velocity.y * restitution;
        }
        if (particle.position.y > 1.0 - radius) {
            particle.position.y = 1.0 - radius;
            particle.velocity.y = -particle.velocity.y * restitution;
        }
        if (particle.position.x < radius) {
            particle.position.x = radius;
            particle.velocity.x = -particle.velocity.x * restitution;
        }
        if (particle.position.x > 1.0 - radius) {
            particle.position.x = 1.0 - radius;
            particle.velocity.x = -particle.velocity.x * restitution;
        }

        output[index] = particle;

}
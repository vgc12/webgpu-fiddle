/**
 * Generate documentation/hints for Monaco editor
 */

/*struct Uniforms {
    resolution : vec2f,
        aspectRatio: f32,
        time: f32,
}*/

function generateUniformDocumentation() {
    const lines: string[] = [
        '\n\n// Available uniform variables in your shader:',
        '// resolution: vec2<f32> - The resolution of the output (width, height)',
        '// aspectRatio: f32 - The aspect ratio of the output (width / height)',
        '// time: f32 - The elapsed time in seconds since the start of the program',
    ];
    return lines.join('\n');
}

export function generateVariableDocumentation(shaderType: 'compute' | 'vertex' | 'fragment'): string {
    const lines: string[] = ['// Available variables in your main() function:'];

    if (shaderType === 'compute') {
        lines.push('// global_id: vec3<u32> - Global invocation ID across all workgroups');
        lines.push('// local_id: vec3<u32> - Local invocation ID within the workgroup');
        lines.push('// workgroup_id: vec3<u32> - Which workgroup this invocation is in');
    } else if (shaderType === 'vertex') {
        lines.push('// vertexIndex: u32 - Index of the current vertex');
        lines.push('// particlePos: vec2<f32> - Position of the particle');
        lines.push('// particleVel: vec2<f32> - Velocity of the particle');
        lines.push('// output: VertexOutput - Set output.position and output.color');
    } else if (shaderType === 'fragment') {
        lines.push('// color: vec4<f32> - Input color from vertex shader');
        lines.push('// fragCoord: vec4<f32> - Fragment coordinates');
        lines.push('// Return: vec4<f32> - Output color for this fragment');
    }

    lines.push(generateUniformDocumentation() + '\n\n');

    return lines.join('\n');
}
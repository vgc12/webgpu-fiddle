/**
 * Generate documentation/hints for Monaco editor
 */
function generateUniformDocumentation() {
    const lines: string[] = [
        '\n\n// Available uniform variables in your shader:',
        '// resolution: vec2<f32> - The resolution of the output (width, height)',
        '// mousePosition: vec2<f32> - The position of the mouse (width, height)',
        '// aspectRatio: f32 - The aspect ratio of the output (width / height)',
        '// time: f32 - The elapsed time in seconds since the start of the program',
        '// deltaTime: f32 - The time in seconds since the previous frame'
    ];
    return lines.join('\n');
}

/**
 * Adds appropriate documentation in the monaco editor telling the user what is available in their shader type.
 * @param shaderType The type of shader (Compute, Vertex, Fragment, Background).
 */
export function generateVariableDocumentation(shaderType: 'compute' | 'vertex' | 'fragment' | 'background'): string {
    const lines: string[] = ['// Available variables in your main() function:'];

    if (shaderType === 'compute') {
        lines.push('// global_id: vec3<u32> - Global invocation ID across all workgroups');
        lines.push('// local_id: vec3<u32> - Local invocation ID within the workgroup');
        lines.push('// workgroup_id: vec3<u32> - Which workgroup this invocation is in');
    } else if (shaderType === 'vertex') {
        lines.push('// vertexIndex: u32 - Index of the current vertex');
        lines.push('// instanceIndex: u32 - Index of the current instance');
        lines.push('// output: VertexOutput - Set output.position and output.color');
    }
    else if (shaderType === 'fragment' || shaderType === 'background') {
        lines.push('// fragCoord: vec4<f32> - Fragment coordinates');
        lines.push('// Return: vec4<f32> - Output color for this fragment');
    }

    lines.push(generateUniformDocumentation() + '\n\n');

    return lines.join('\n');
}
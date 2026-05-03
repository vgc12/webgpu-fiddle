// Compiles shaders on the GPU and returns diagnostics with line numbers
// remapped from the injected full code back to the user's original code.

// A single shader compilation diagnostic (error, warning, or info).
export interface shader_diagnostic {
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}


// Compile the full (injected) shader on the GPU, collect any diagnostics,
// and remap their line numbers back to the user's original code by subtracting
// the prefix length and mid-function injection offsets.
export async function validateShader(
    device: GPUDevice,
    userCode: string,
    fullCode: string,
    label: string,
    prefixLineCount: number,
    injections: { atLine: number; linesAdded: number }[]
): Promise<shader_diagnostic[]> {
    const shaderModule = device.createShaderModule({ code: fullCode, label });
    const info = await shaderModule.getCompilationInfo();

    if (info.messages.length === 0) {
        return [];
    }

    const maxUserLine = userCode.split('\n').length;

    return info.messages.map(msg => {
        let line = msg.lineNum;

        // Subtract mid-function injections (in reverse order)
        for (let i = injections.length - 1; i >= 0; i--) {
            if (line > injections[i].atLine) {
                line -= injections[i].linesAdded;
            }
        }

        // Subtract the prefix
        line -= prefixLineCount;

        line = Math.max(1, Math.min(line, maxUserLine));

        return {
            line,
            column: Math.max(1, msg.linePos),
            length: msg.length,
            message: msg.message,
            severity: msg.type as 'error' | 'warning' | 'info',
        };
    });
}
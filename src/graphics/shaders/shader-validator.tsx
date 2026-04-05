 
export interface shader_diagnostic {
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

/**
 * Build a mapping from injected-code line numbers to user-code line numbers.
 * Walks both arrays in parallel, matching identical lines to handle
 * the uniform struct prefix and the per-function uniform defs injection.
 */
function buildLineMap(userCode: string, injectedCode: string): Map<number, number> {
    const userLines = userCode.split('\n');
    const injectedLines = injectedCode.split('\n');
    const map = new Map<number, number>();

    let userIdx = 0;
    for (let injIdx = 0; injIdx < injectedLines.length; injIdx++) {
        if (userIdx < userLines.length && injectedLines[injIdx] === userLines[userIdx]) {
            map.set(injIdx + 1, userIdx + 1);
            userIdx++;
        }
    }

    return map;
}

function mapLineToUser(injectedLine: number, lineMap: Map<number, number>, maxUserLine: number): number {
    const direct = lineMap.get(injectedLine);
    if (direct !== undefined) {
        return direct;
    }

    // Find the closest mapped line before this one
    let closest = 1;
    for (const [injLine, userLine] of lineMap) {
        if (injLine <= injectedLine && userLine > closest) {
            closest = userLine;
        }
    }
    return Math.min(closest, maxUserLine);
}

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
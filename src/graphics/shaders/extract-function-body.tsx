/**
 * Extracts the body of a function from user code
 * Strips the function declaration and braces, returning just the inner code
 * Handles functions with or without parameters and return types
 *
 * @param userCode - User's shader code containing a function
 * @param functionName - Name of the function to extract (defaults to 'main')
 * @returns The code inside the function body
 *
 * @example
 * ```typescript
 * const input = `fn main() -> vec4f { return color; }`;
 * const body = extractFunctionBody(input);
 * // Returns: " return color; "
 * ```
 */
export function extractFunctionBody(userCode: string, functionName: string = 'main'): string {
    const trimmed = userCode.trim();

    // Try different patterns:
    // 1. fn main(params) -> ReturnType { ... }
    // 2. fn main() -> ReturnType { ... }
    // 3. fn main(params) { ... }
    // 4. fn main() { ... }
    // 5. Just code without function wrapper

    const patterns = [
        // With parameters and return type
        new RegExp(`fn\\s+${functionName}\\s*\\([^)]*\\)\\s*->\\s*[^{]+\\s*\\{([\\s\\S]*)\\}\\s*$`),
        // Without parameters but with return type
        new RegExp(`fn\\s+${functionName}\\s*\\(\\)\\s*->\\s*[^{]+\\s*\\{([\\s\\S]*)\\}\\s*$`),
        // With parameters, no return type
        new RegExp(`fn\s+${functionName}\s*\([^)]*\)\s*\{([\s\S]*)}\s*$`),
        // Without parameters, no return type  
        new RegExp(`fn\\s+${functionName}\\s*\\(\\)\\s*\\{([\\s\\S]*)\\}\\s*$`),
    ];

    for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // No function wrapper found, return original
    return userCode;
}
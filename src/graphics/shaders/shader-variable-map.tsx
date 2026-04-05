/**
 * Maps user-friendly variable names to actual shader builtins/parameters
 */
export interface ShaderVariableMap {
    /** Variables available in user's main() function */
    userVariables: string[];
    /** How those map to actual shader parameters */
    parameterMap: Map<string, string>;
}
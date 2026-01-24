import type {ShaderVariableMap} from "@/graphics/shader-variable-map.tsx";

/**
 * Gets the variable mapping for compute shaders
 * Users have access to: global_id, local_id, workgroup_id
 */
export function getComputeVariableMap(): ShaderVariableMap {
    return {
        userVariables: ['global_id', 'local_id', 'workgroup_id'],
        parameterMap: new Map([
            ['global_id', '@builtin(global_invocation_id) global_id: vec3<u32>'],
            ['local_id', '@builtin(local_invocation_id) local_id: vec3<u32>'],
            ['workgroup_id', '@builtin(workgroup_id) workgroup_id: vec3<u32>'],
        ])
    };
}
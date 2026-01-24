import {getFragmentVariableMap} from "@/graphics/get-fragment-variable-map.tsx";
import {getVertexVariableMap} from "@/graphics/get-vertex-variable-map.tsx";
import {getComputeVariableMap} from "@/graphics/get-compute-variable-map.tsx";

/**
 * Helper to generate Monaco editor hints for available variables
 */
export function getAvailableVariables(shaderType: 'compute' | 'vertex' | 'fragment'): string[] {
    switch (shaderType) {
        case 'compute':
            return getComputeVariableMap().userVariables;
        case 'vertex':
            return getVertexVariableMap().userVariables;
        case 'fragment':
            return getFragmentVariableMap().userVariables;
    }
}
import uniforms from '@/shaders/uniforms.wgsl';
import {getFragmentVariableMap} from "@/graphics/get-fragment-variable-map.tsx";
import {getVertexVariableMap} from "@/graphics/get-vertex-variable-map.tsx";
import {getComputeVariableMap} from "@/graphics/get-compute-variable-map.tsx";
import {extractFunctionBody} from "@/graphics/extract-function-body.tsx";
import type {FragmentOutput} from "@/graphics/fragment-output.tsx";

import defaultParticleCompute from '@/shaders/default.particle.compute.wgsl';
import defaultParticleVertexCompute from '@/shaders/default.particle.vertex.wgsl';
import defaultParticleFragmentCompute from '@/shaders/default.particle.fragment.wgsl';

export function getDefaultParticleComputeShader(): string {
    return defaultParticleCompute;
}

export function getDefaultParticleVertexShader(): string {
    return defaultParticleVertexCompute;
}

export function getDefaultParticleFragmentShader(): string {
    return defaultParticleFragmentCompute;
}

export function getUniformDefinitions(): string {
    return `
    let resolution : vec2<f32> = uniforms.resolution;
    let aspectRatio : f32 = uniforms.aspectRatio;
    let time : f32 = uniforms.time;
    `
}


/**
 * Configuration options for the ShaderBuilder
 */
export const shader_type = {
    COMPUTE: 'compute',
    VERTEX: 'vertex',
    FRAGMENT: 'fragment'
} as const;

export type ShaderType = typeof shader_type[keyof typeof shader_type];

export interface ShaderBuilderOptions {
    /** Whether to automatically include the uniforms WGSL code. Defaults to true */
    includeUniforms?: boolean;
    /** Default workgroup size for compute shaders */
    computeWorkgroupSize?: { x: number; y?: number; z?: number };
    /** Default vertex shader attributes */
    vertexAttributes?: VertexAttribute[];
    /** Default fragment shader outputs */
    fragmentOutputs?: FragmentOutput[];
}

/**
 * Defines a vertex shader attribute with its binding location and type
 */
export interface VertexAttribute {
    /** Binding location (@location(N)) */
    location: number;
    /** Parameter name in the shader */
    name: string;
    /** WGSL type (e.g., 'vec2<f32>', 'f32', 'u32') */
    type: string;
}

/**
 * Builder class for constructing WGSL shaders with consistent structure and formatting.
 *
 * Features:
 * - Automatic uniform injection
 * - Proper code indentation
 * - Support for compute, vertex, and fragment shaders
 * - Exposes simplified builtins to users via main() function
 * - Reusable builder pattern for adding structs, bindings, and helper functions
 *
 * @example
 * ```typescript
 * const builder = new ShaderBuilder();
 * builder.addStructs('struct Particle { position: vec2<f32> }');
 * builder.addBindings('@group(0) @binding(0) var<storage> particles: array<Particle>;');
 * const shader = builder.buildCompute('particles[global_id.x].position += vec2(1.0, 0.0);');
 * ```
 */
export class ShaderBuilder {
    private shaderCode: string = '';

    constructor(private options: ShaderBuilderOptions = {}) {
        if (options.includeUniforms !== false) {
            this.addUniforms();
        }
    }

    /**
     * Adds struct definitions to the shader
     * @param structs - WGSL struct definitions
     * @returns This builder instance for chaining
     *
     * @example
     * ```typescript
     * builder.addStructs(`
     *   struct Particle {
     *     position: vec2<f32>,
     *     velocity: vec2<f32>,
     *   }
     * `);
     * ```
     */
    addStructs(structs: string): ShaderBuilder {
        this.shaderCode += structs + '\n\n';
        return this;
    }

    /**
     * Adds binding declarations to the shader
     * @param bindings - WGSL binding declarations (@group/@binding)
     * @returns This builder instance for chaining
     *
     * @example
     * ```typescript
     * builder.addBindings(`
     *   @group(0) @binding(1) var<storage, read> input: array<Particle>;
     *   @group(0) @binding(2) var<storage, read_write> output: array<Particle>;
     * `);
     * ```
     */
    addBindings(bindings: string): ShaderBuilder {
        this.shaderCode += bindings + '\n\n';
        return this;
    }

    /**
     * Adds helper function definitions to the shader
     * @param functions - WGSL function definitions
     * @returns This builder instance for chaining
     *
     * @example
     * ```typescript
     * builder.addHelperFunctions(`
     *   fn randomFloat(seed: u32) -> f32 {
     *     return fract(sin(f32(seed)) * 43758.5453);
     *   }
     * `);
     * ```
     */
    addHelperFunctions(functions: string): ShaderBuilder {
        this.shaderCode += functions + '\n\n';
        return this;
    }

    /**
     * Builds a compute shader where users write: fn main() { ... }
     * User code has access to: global_id, local_id, workgroup_id
     *
     * @param userCode - The user's compute shader code (containing fn main() or raw code)
     * @param workgroupSize - Workgroup dimensions (defaults to 64x1x1)
     * @returns Complete WGSL compute shader code
     *
     * @example
     * ```typescript
     * const shader = builder.buildCompute(`
     *   fn main() {
     *     let index = global_id.x;
     *     output[index] = input[index] * 2.0;
     *   }
     * `);
     * ```
     */
    buildCompute(userCode: string, workgroupSize = {x: 64, y: 1, z: 1}): string {
        const ws = this.options.computeWorkgroupSize || workgroupSize;
        const bodyCode = getUniformDefinitions() + extractFunctionBody(userCode);
        const varMap = getComputeVariableMap();

        // Build parameter list from variable map
        const params = Array.from(varMap.parameterMap.values()).join(',\n    ');

        return `${this.shaderCode}@compute @workgroup_size(${ws.x}, ${ws.y || 1}, ${ws.z || 1})
fn computeMain(
    ${params}
) {
${this.indentCode(bodyCode, 1)}
}
`;
    }

    /**
     * Builds a vertex shader where users write: fn main() { ... }
     * User code has access to: vertexIndex, output, and all vertex attributes
     * Users must set output.position and output.color
     *
     * @param userCode - The user's vertex shader code (containing fn main() or raw code)
     * @param attributes - Optional vertex attributes (overrides options.vertexAttributes)
     * @returns Complete WGSL vertex shader code
     *
     * @example
     * ```typescript
     * const shader = builder.buildVertex(`
     *   fn main() {
     *     output.position = vec4<f32>(particlePos, 0.0, 1.0);
     *     output.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
     *   }
     * `, [{ location: 0, name: 'particlePos', type: 'vec2<f32>' }]);
     * ```
     */
    buildVertex(userCode: string, attributes?: VertexAttribute[]): string {
        const attrs = attributes || this.options.vertexAttributes || [];
        const bodyCode = extractFunctionBody(userCode);
        const varMap = getVertexVariableMap(attrs);

        const vertexOutput = `struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

`;

        // Build parameter list
        const params = Array.from(varMap.parameterMap.values()).join(',\n    ');

        return `${this.shaderCode}${vertexOutput}@vertex
fn vertexMain(
    ${params}
) -> VertexOutput {
${this.indentCode(bodyCode, 1)}
}
`;
    }

    /**
     * Builds a fragment shader where users write: fn main() { ... }
     * User code has access to: color (input), fragCoord
     * Users must return a vec4<f32> for the output color
     *
     * @param userCode - The user's fragment shader code (containing fn main() or raw code)
     * @param outputs - Optional fragment outputs (overrides options.fragmentOutputs)
     * @returns Complete WGSL fragment shader code
     *
     * @example
     * ```typescript
     * const shader = builder.buildFragment(`
     *   fn main() {
     *     return vec4<f32>(color.rgb * 0.5, 1.0);
     *   }
     * `);
     * ```
     */
    buildFragment(userCode: string, outputs?: FragmentOutput[]): string {
        const outs = outputs || this.options.fragmentOutputs || [{location: 0, type: 'vec4<f32>'}];
        const bodyCode = extractFunctionBody(userCode);
        const varMap = getFragmentVariableMap();

        const returnType = outs.length === 1
                           ? `@location(${outs[0].location}) ${outs[0].type}`
                           : `@location(0) vec4<f32>`;

        // Build parameter list
        const params = Array.from(varMap.parameterMap.values()).join(',\n    ');

        return `${this.shaderCode}@fragment
fn fragmentMain(
    ${params}
) -> ${returnType} {
${this.indentCode(bodyCode, 1)}
}
`;
    }

    /**
     * Builds a complete vertex + fragment shader pair with the user's code
     * Users write fn main() for both vertex and fragment
     *
     * @param vertexCode - The user's vertex shader code
     * @param fragmentCode - The user's fragment shader code
     * @param attributes - Optional vertex attributes
     * @returns Complete WGSL shader code with both vertex and fragment stages
     *
     * @example
     * ```typescript
     * const shader = builder.buildVertexFragment(
     *   'fn main() { output.position = vec4<f32>(particlePos, 0.0, 1.0); }',
     *   'fn main() { return color; }'
     * );
     * ```
     */
    buildVertexFragment(vertexCode: string, fragmentCode: string, attributes?: VertexAttribute[]): string {
        const attrs = attributes || this.options.vertexAttributes || [];
        const vertexBody = getUniformDefinitions() + extractFunctionBody(vertexCode);
        const fragmentBody = getUniformDefinitions() + extractFunctionBody(fragmentCode);

        const vertexVarMap = getVertexVariableMap(attrs);
        const fragmentVarMap = getFragmentVariableMap();

        const vertexOutput = `struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
}

`;

        const vertexParams = Array.from(vertexVarMap.parameterMap.values()).join(',\n    ');
        const fragmentParams = Array.from(fragmentVarMap.parameterMap.values()).join(',\n    ');

        return `${this.shaderCode}${vertexOutput}@vertex
fn vertexMain(
    ${vertexParams}
) -> VertexOutput {
${this.indentCode(vertexBody, 1)}
}

@fragment
fn fragmentMain(
    ${fragmentParams}
) -> @location(0) vec4<f32> {
${this.indentCode(fragmentBody, 1)}
}
`;
    }

    /**
     * Returns the current shader code without any wrapper functions
     * @returns Raw shader code built so far
     */
    build(): string {
        return this.shaderCode;
    }

    /**
     * Resets the builder to its initial state, clearing all added code
     * Uniforms are re-added if includeUniforms is true
     * @returns This builder instance for chaining
     */
    reset(): ShaderBuilder {
        this.shaderCode = '';
        if (this.options.includeUniforms !== false) {
            this.addUniforms();
        }
        return this;
    }

    /**
     * Adds the standard uniforms WGSL code to the shader
     * @private
     */
    private addUniforms(): ShaderBuilder {
        this.shaderCode += uniforms + '\n\n';
        return this;
    }

    /**
     * Indents code by a specified number of levels (4 spaces per level)
     * @param code - The code to indent
     * @param level - Number of indentation levels
     * @returns Indented code
     * @private
     */
    private indentCode(code: string, level: number): string {
        const indent = '    '.repeat(level);
        return code
            .split('\n')
            .map(line => (line.trim() ? indent + line : line))
            .join('\n');
    }
}



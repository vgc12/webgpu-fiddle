// Core shader processing: uniform injection into WGSL entry points, WGSL struct
// parsing with alignment/offset calculation, and pre-built ShaderConfig constants.

import {TypeInfo} from "@/graphics/utils/type-info.tsx";
import squareParticleCompute from '@/shaders/particle/rain/compute.wgsl';
import squareParticleVertexCompute from '@/shaders/particle/rain/vertex.wgsl';
import squareParticleFragmentCompute from '@/shaders/particle/rain/fragment.wgsl';
import blankCanvasVertexShader from '@/shaders/canvas/blank/vertex.wgsl';
import blankCanvasFragmentShader from '@/shaders/canvas/blank/fragment.wgsl'
import rayMarchCanvasFragmentShader from '@/shaders/canvas/sdf/fragment.wgsl';
import juliaFragmentShader from '@/shaders/canvas/julia/fragment.wgsl';
import blankParticleComputeShader from '@/shaders/particle/blank/compute.wgsl';
import blankParticleVertexShader from '@/shaders/particle/blank/vertex.wgsl';
import blankParticleFragmentShader from '@/shaders/particle/blank/fragment.wgsl';

import golCompute from '@/shaders/particle/gol/compute.wgsl';
import golVertex from '@/shaders/particle/gol/vertex.wgsl';
import golFragment from '@/shaders/particle/gol/fragment.wgsl';
import defaultBackgroundShader from '@/shaders/particle/default-background.wgsl';

import uniformStruct from '@/shaders/uniforms.wgsl';
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";

export const BlankShaderConfig : ShaderConfig = {
    vertexShader : blankCanvasVertexShader,
    fragmentShader: blankCanvasFragmentShader,
    computeShader : ''
}

export const RaymarchShaderConfig : ShaderConfig = {
    vertexShader: blankCanvasVertexShader,
    fragmentShader: rayMarchCanvasFragmentShader,
    computeShader: ''
};

export const BlankParticleConfig : ShaderConfig = {
    computeShader: blankParticleComputeShader,
    vertexShader: blankParticleVertexShader,
    fragmentShader: blankParticleFragmentShader,
    backgroundShader: defaultBackgroundShader,
}

export const ParticleShaderConfig: ShaderConfig = {
    computeShader: squareParticleCompute,
    vertexShader: squareParticleVertexCompute,
    fragmentShader: squareParticleFragmentCompute,
    backgroundShader: defaultBackgroundShader,
};

export const JuliaShaderConfig: ShaderConfig = {
    vertexShader: blankCanvasVertexShader,
    fragmentShader: juliaFragmentShader,
    computeShader: ''
};

export const GolShaderConfig: ShaderConfig = {
    computeShader: golCompute,
    vertexShader: golVertex,
    fragmentShader: golFragment,
    backgroundShader: defaultBackgroundShader,
};

// Parse the @workgroup_size(x, y, z) attribute from a compute shader.
// Returns [64, 1, 1] as a default if not found.
export function getWorkgroupSize(computeShader: string): [number, number, number] {
    const match = computeShader.match(
        /@workgroup_size\s*\(\s*(\d+)(?:\s*,\s*(\d+))?(?:\s*,\s*(\d+))?\s*\)/
    );

    if (!match) {
        console.warn('No @workgroup_size found, using default [64, 1, 1]');
        return [64, 1, 1];
    }

    const x = parseInt(match[1]);
    const y = match[2] ? parseInt(match[2]) : 1;
    const z = match[3] ? parseInt(match[3]) : 1;

    return [x, y, z];
}

// Prepend the uniform struct/bindings and inject uniform assignment statements
// into every @vertex, @fragment, and @compute entry point. Returns the transformed
// code plus metadata (prefix line count, injection positions) for error line remapping.
export function injectUniformsIntoShader(wgslCode: string): { code: string; prefixLineCount: number; injections: { atLine: number; linesAdded: number }[] } {
    const prefix = uniformStruct + '\n';
    const prefixLineCount = prefix.split('\n').length - 1;

    let result = prefix + wgslCode;

    const uniformDefs = `
    resolution = uniforms.resolution;
    mousePosition = uniforms.mousePosition;
    aspectRatio = uniforms.aspectRatio;
    time = uniforms.time;
    deltaTime = uniforms.deltaTime;`;
    const defsLineCount = uniformDefs.split('\n').length - 1;

    const functionRegex = /(@(?:compute|vertex|fragment)[^\n]*\n\s*fn\s+\w+\s*\([^)]*\)[^{]*{)/g;

    const injections: { atLine: number; linesAdded: number }[] = [];
    let extraLines = 0;

    result = result.replace(functionRegex, (match, _group, offset) => {
        const lineNum = result.substring(0, offset + match.length).split('\n').length;
        injections.push({ atLine: lineNum + extraLines, linesAdded: defsLineCount });
        extraLines += defsLineCount;
        return match + uniformDefs;
    });

    return { code: result, prefixLineCount, injections };
}


export interface StructField {
    name: string;
    type: string;
    size: number;      // Size in bytes
    alignment: number; // Alignment requirement in bytes
    offset: number;    // Offset within struct
}

export interface StructInfo {
    name: string;
    fields: StructField[];
    structText?: string;
    size: number;      // Total size in bytes
    alignment: number; // Struct alignment
}




/** Find the @binding declaration for a variable name (e.g. 'input'), extract its
 type (unwrapping array<T> if needed), and return the matching parsed struct.
*/
export function getStructFromBufferBinding(wgslCode: string, bindingName: string): StructInfo | null {
    // First, parse all structs
    const allStructs = parseAllStructsFromWGSL(wgslCode);

    // Find the binding and extract its type
    const bindingRegex = new RegExp(
        `@group\\(\\d+\\)\\s+@binding\\(\\d+\\)\\s+var<(?:uniform|storage)(?:,\\s*(?:read|read_write))?>\\s+${bindingName}\\s*:\\s*([^;]+);`,
        's'
    );

    const match = wgslCode.match(bindingRegex);
    if (!match) {
        console.warn(`Could not find binding: ${bindingName}`);
        return null;
    }

    const dataType = match[1].trim();

    // Extract element type if it's an array
    const arrayMatch = dataType.match(/array<(.+)>/);
    const structName = arrayMatch ? arrayMatch[1].trim() : dataType;

    // Look up the struct
    const structInfo = allStructs.get(structName);
    if (!structInfo) {
        console.warn(`Could not find struct definition for: ${structName}`);
        return null;
    }

    return structInfo;
}


/** Find all struct definitions in WGSL code and return a map of name to parsed info.
 *
 * @param wgslCode The shader code from a shader
 */
export function parseAllStructsFromWGSL(wgslCode: string): Map<string, StructInfo> {
    const structs = new Map<string, StructInfo>();

    // Find all struct definitions
    const structRegex = /struct\s+(\w+)\s*{([^}]*)}/gs;

    let match;
    while ((match = structRegex.exec(wgslCode)) !== null) {
        const structName = match[1];
        const structBody = match[2];

        const structInfo = parseStructFields(structName, structBody);

        if (structInfo) {
            structs.set(structName, structInfo);
        }
    }

    return structs;
}

/**
 * Parses a struct and gets information about the fields from theme.
 * @param structName Name of the struct.
 * @param structBody A string that contains the full struct code.
 */
function parseStructFields(structName: string, structBody: string): StructInfo | null {
    // Parse fields: name: type,
    const fieldRegex = /(\w+)\s*:\s*([^,\n]+)/g;
    const fields: StructField[] = [];
    let currentOffset = 0;
    let maxAlignment = 1;

    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(structBody)) !== null) {
        const fieldName = fieldMatch[1].trim();
        let fieldType = fieldMatch[2].trim();

        // Remove trailing comma if present
        fieldType = fieldType.replace(/,$/, '').trim();

        const typeInfo = TypeInfo[fieldType];
        if (!typeInfo) {
            console.warn(`Unknown type: ${fieldType} for field ${fieldName} in struct ${structName}`);
            continue;
        }

        // Align current offset to field's alignment requirement
        currentOffset = alignTo(currentOffset, typeInfo.alignment);

        fields.push({
            name: fieldName,
            type: fieldType,
            size: typeInfo.size,
            alignment: typeInfo.alignment,
            offset: currentOffset,
        });

        currentOffset += typeInfo.size;
        maxAlignment = Math.max(maxAlignment, typeInfo.alignment);
    }

    if (fields.length === 0) {
        return null;
    }

    // Final struct size must be aligned to its largest member alignment
    const totalSize = alignTo(currentOffset, maxAlignment);

    return {
        name: structName,
        fields,
        size: totalSize,
        structText: structBody,
        alignment: maxAlignment,
    };
}


/** Round offset up to the next multiple of alignment.
 *
 * @param offset The value to be aligned.
 * @param alignment The alignment boundary (must be a positive integer).
 * @returns The smallest multiple of `alignment` that is greater than or equal to `offset`.
 */
export function alignTo(offset: number, alignment: number): number {
    return Math.ceil(offset / alignment) * alignment;
}

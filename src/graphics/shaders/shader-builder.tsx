import {TypeInfo} from "@/graphics/utils/type-info.tsx";
import squareParticleCompute from '@/shaders/particle.compute.spheres.wgsl';
import squareParticleVertexCompute from '@/shaders/particle.vertex.spheres.wgsl';
import squareParticleFragmentCompute from '@/shaders/particle.fragment.spheres.wgsl';
import blankCanvasVertexShader from '@/shaders/canvas.vertex.blank.wgsl';
import blankCanvasFragmentShader from '@/shaders/canvas.fragment.blank.wgsl'
import raymachCanvasFragmentShader from '@/shaders/canvas.fragment.sdf.wgsl';
import juliaFragmentShader from '@/shaders/canvas.fragment.julia.wgsl';
import blankParticleComputeShader from '@/shaders/particle.compute.blank.wgsl';
import blankParticleVertexShader from '@/shaders/particle.vertex.blank.wgsl';
import blankParticleFragmentShader from '@/shaders/particle.fragment.blank.wgsl';

import golCompute from '@/shaders/particle.compute.gol.wgsl';
import golVertex from '@/shaders/particle.vertex.gol.wgsl';
import golFragment from '@/shaders/particle.fragment.gol.wgsl';

import uniformStruct from '@/shaders/uniforms.wgsl';
import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";

export const BlankShaderConfig : ShaderConfig = {
    vertexShader : blankCanvasVertexShader,
    fragmentShader: blankCanvasFragmentShader,
    computeShader : ''
}

export const RaymarchShaderConfig : ShaderConfig = {
    vertexShader: blankCanvasVertexShader,
    fragmentShader: raymachCanvasFragmentShader,
    computeShader: ''
};

export const BlankParticleConfig : ShaderConfig = {
    computeShader: blankParticleComputeShader,
    vertexShader: blankParticleVertexShader,
    fragmentShader: blankParticleFragmentShader,
}

export const ParticleShaderConfig: ShaderConfig = {
    computeShader: squareParticleCompute,
    vertexShader: squareParticleVertexCompute,
    fragmentShader: squareParticleFragmentCompute
};

export const JuliaShaderConfig: ShaderConfig = {
    vertexShader: blankCanvasVertexShader,
    fragmentShader: juliaFragmentShader,
    computeShader: ''
};

export const GolShaderConfig: ShaderConfig = {
    computeShader: golCompute,
    vertexShader: golVertex,
    fragmentShader: golFragment
};

export function getWorkgroupSize(computeShader: string): [number, number, number] {
    const match = computeShader.match(
        /@workgroup_size\s*\(\s*(\d+)(?:\s*,\s*(\d+))?(?:\s*,\s*(\d+))?\s*\)/
    );

    if (!match) {
        console.warn('No @workgroup_size found, using default [64, 1, 1]');
        return [64, 1, 1];
    }

    //console.log('workgroup_size match:', match[0]);

    const x = parseInt(match[1]);
    const y = match[2] ? parseInt(match[2]) : 1;
    const z = match[3] ? parseInt(match[3]) : 1;

    return [x, y, z];
}

export function injectUniformsIntoShader(wgslCode: string): { code: string; prefixLineCount: number; injections: { atLine: number; linesAdded: number }[] } {
    const prefix = uniformStruct + '\n';
    const prefixLineCount = prefix.split('\n').length - 1;

    let result = prefix + wgslCode;

    const uniformDefs = `
    resolution = uniforms.resolution;
    mousePosition = uniforms.mousePosition;
    aspectRatio = uniforms.aspectRatio;
    time = uniforms.time;`;
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


export function alignTo(offset: number, alignment: number): number {
    return Math.ceil(offset / alignment) * alignment;
}

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


export function parseStructFromWGSL(wgslCode: string, structName: string): StructInfo | null {
    // Regex to find struct definition
    const structRegex = new RegExp(
        `struct\\s+${structName}\\s*{([^}]*)}`,
        's'
    );

    const match = wgslCode.match(structRegex);
    if (!match) {
        return null;
    }

    const structBody = match[1];

    // Parse fields: name: type,
    const fieldRegex = /(\w+)\s*:\s*([^,]+),?/g;
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
            console.warn(`Unknown type: ${fieldType} for field ${fieldName}`);
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

    // Final struct size must be aligned to its largest member alignment
    const totalSize = alignTo(currentOffset, maxAlignment);

    return {
        name: structName,
        fields,
        size: totalSize,
        alignment: maxAlignment,
    };
}
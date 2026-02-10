import {TypeInfo} from "@/graphics/type-info.tsx";
import defaultParticleCompute from '@/shaders/default.particle.compute.wgsl';
import defaultParticleVertexCompute from '@/shaders/default.particle.vertex.wgsl';
import defaultParticleFragmentCompute from '@/shaders/default.particle.fragment.wgsl';
import defaultCanvasVertexShader from '@/shaders/default.canvas.vertex.wgsl';
import defaultCanvasFragmentShader from '@/shaders/default.canvas.fragment.wgsl';

import uniformStruct from '@/shaders/uniforms.wgsl';
import type {ShaderConfig} from "@/graphics/shader_config.tsx";

export const canvasShaderConfig: ShaderConfig = {
    vertexShader: defaultCanvasVertexShader,
    fragmentShader: defaultCanvasFragmentShader
};

export const particleShaderConfig: ShaderConfig = {
    computeShader: defaultParticleCompute,
    vertexShader: defaultParticleVertexCompute,
    fragmentShader: defaultParticleFragmentCompute
};


export function getWorkgroupSize(computeShader: string): [number, number, number] {
    // Match @workgroup_size(X) or @workgroup_size(X, Y) or @workgroup_size(X, Y, Z)
    const match = computeShader.match(
        /@workgroup_size\s*\(\s*(\d+)(?:\s*,\s*(\d+))?(?:\s*,\s*(\d+))?\s*\)/
    );

    if (!match) {
        console.warn('No @workgroup_size found in compute shader, using default [64, 1, 1]');
        return [64, 1, 1];
    }

    const x = parseInt(match[1]);
    const y = match[2] ? parseInt(match[2]) : 1;
    const z = match[3] ? parseInt(match[3]) : 1;

    // Validate total invocations


    return [x, y, z];
}


export function injectUniformsIntoShader(wgslCode: string): string {
    wgslCode = uniformStruct + '\n' + wgslCode;

    const uniformDefs = `
    let resolution = uniforms.resolution;
    let aspectRatio = uniforms.aspectRatio;
    let time = uniforms.time;`;

    // Regex to find any function with @compute, @vertex, or @fragment attribute
    // Captures the entire function declaration up to and including the opening brace
    const functionRegex = /(@(?:compute|vertex|fragment)[^\n]*\n\s*fn\s+\w+\s*\([^)]*\)[^{]*{)/g;


    return wgslCode.replace(functionRegex, (match) => {
        // Insert uniform definitions right after the opening brace
        return match + uniformDefs;
    });
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
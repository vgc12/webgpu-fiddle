import type {StructField} from "@/graphics/shaders/shader-builder.tsx";

export type base_type = 'f32' | 'u32' | 'i32';

export type value_source = (fieldIndex: number, componentIndex: number, count: number, baseType: base_type) => number;

export function getFieldComponents(type: string): { count: number; baseType: base_type } {
    if (type === 'f32') return { count: 1, baseType: 'f32' };
    if (type === 'u32') return { count: 1, baseType: 'u32' };
    if (type === 'i32') return { count: 1, baseType: 'i32' };

    const vecMatch = type.match(/vec(\d)(?:<(\w+)>|([fiu]))/);
    if (vecMatch) {
        const count = parseInt(vecMatch[1]);
        const inner = vecMatch[2] || ({ f: 'f32', i: 'i32', u: 'u32' } as Record<string, string>)[vecMatch[3]];
        return { count, baseType: inner as base_type };
    }

    return { count: 1, baseType: 'f32' };
}

export function writeTypedValue(view: DataView, byteOffset: number, value: number, baseType: base_type): void {
    switch (baseType) {
        case 'u32': view.setUint32(byteOffset, value >>> 0, true); break;
        case 'i32': view.setInt32(byteOffset, value | 0, true); break;
        case 'f32': view.setFloat32(byteOffset, value, true); break;
    }
}

export function resolveFieldValue(fieldValue: any, componentIndex: number, componentCount: number): number {
    if (fieldValue == null) return 0;
    if (componentCount === 1) return typeof fieldValue === 'number' ? fieldValue : 0;
    return Array.isArray(fieldValue) && componentIndex < fieldValue.length ? fieldValue[componentIndex] : 0;
}

export function randomValueForType(baseType: base_type): number {
    return baseType === 'f32' ? Math.random() * 2 - 1 : (Math.random() > 0.65 ? 1 : 0);
}

export function writeStructInstance(view: DataView, structOffset: number, fields: StructField[], getValue: value_source): void {
    for (let f = 0; f < fields.length; f++) {
        const field = fields[f];
        const { count, baseType } = getFieldComponents(field.type);

        for (let c = 0; c < count; c++) {
            writeTypedValue(view, structOffset + field.offset + c * 4, getValue(f, c, count, baseType), baseType);
        }
    }
}

export function jsonValueSource(jsonData: any[], instanceIndex: number, isSingleField: boolean): value_source {
    const instance = instanceIndex < jsonData.length ? jsonData[instanceIndex] : null;

    return (fieldIndex, componentIndex, count, _baseType) => {
        const fieldValue = instance == null
            ? null
            : isSingleField ? instance : instance[fieldIndex];

        return resolveFieldValue(fieldValue, componentIndex, count);
    };
}

import {describe, expect, it} from 'vitest';
import {
    getFieldComponents,
    writeTypedValue,
    resolveFieldValue,
    writeStructInstance,
} from '@/graphics/utils/buffer-writer.tsx';
import type {StructField} from '@/graphics/shaders/shader-builder.tsx';
import multiFieldJson from '../../test-data/particle-multi-field.json';
import singleFieldJson from '../../test-data/gol-single-field.json';

describe('getFieldComponents', () => {
    it('returns count 1 for scalar f32', () => {
        expect(getFieldComponents('f32')).toEqual({count: 1, baseType: 'f32'});
    });

    it('returns count 1 for scalar u32', () => {
        expect(getFieldComponents('u32')).toEqual({count: 1, baseType: 'u32'});
    });

    it('returns count 1 for scalar i32', () => {
        expect(getFieldComponents('i32')).toEqual({count: 1, baseType: 'i32'});
    });

    it('parses vec2<f32>', () => {
        expect(getFieldComponents('vec2<f32>')).toEqual({count: 2, baseType: 'f32'});
    });

    it('parses vec3<u32>', () => {
        expect(getFieldComponents('vec3<u32>')).toEqual({count: 3, baseType: 'u32'});
    });

    it('parses vec4<i32>', () => {
        expect(getFieldComponents('vec4<i32>')).toEqual({count: 4, baseType: 'i32'});
    });

    it('parses shorthand vec2f', () => {
        expect(getFieldComponents('vec2f')).toEqual({count: 2, baseType: 'f32'});
    });

    it('parses shorthand vec3u', () => {
        expect(getFieldComponents('vec3u')).toEqual({count: 3, baseType: 'u32'});
    });

    it('parses shorthand vec4i', () => {
        expect(getFieldComponents('vec4i')).toEqual({count: 4, baseType: 'i32'});
    });

    it('defaults to f32 scalar for unknown types', () => {
        expect(getFieldComponents('mat4x4f')).toEqual({count: 1, baseType: 'f32'});
    });
});

describe('writeTypedValue', () => {
    it('writes f32 value', () => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        writeTypedValue(view, 0, 3.14, 'f32');
        expect(view.getFloat32(0, true)).toBeCloseTo(3.14);
    });

    it('writes u32 value', () => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        writeTypedValue(view, 0, 42, 'u32');
        expect(view.getUint32(0, true)).toBe(42);
    });

    it('writes i32 value', () => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        writeTypedValue(view, 0, -7, 'i32');
        expect(view.getInt32(0, true)).toBe(-7);
    });

    it('writes at correct byte offset', () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        writeTypedValue(view, 4, 99.5, 'f32');
        expect(view.getFloat32(0, true)).toBe(0);
        expect(view.getFloat32(4, true)).toBeCloseTo(99.5);
    });
});

describe('resolveFieldValue', () => {
    it('returns 0 for null field value', () => {
        expect(resolveFieldValue(null, 0, 1)).toBe(0);
    });

    it('returns 0 for undefined field value', () => {
        expect(resolveFieldValue(undefined, 0, 1)).toBe(0);
    });

    it('returns number directly for single-component field', () => {
        expect(resolveFieldValue(5, 0, 1)).toBe(5);
    });

    it('returns 0 for non-number single-component field', () => {
        expect(resolveFieldValue('bad', 0, 1)).toBe(0);
    });

    it('indexes into array for multi-component field', () => {
        expect(resolveFieldValue([10, 20, 30], 1, 3)).toBe(20);
    });

    it('returns 0 for out-of-bounds component index', () => {
        expect(resolveFieldValue([10, 20], 2, 3)).toBe(0);
    });

    it('returns 0 for non-array multi-component field', () => {
        expect(resolveFieldValue(5, 0, 2)).toBe(0);
    });
});

describe('writeStructInstance', () => {
    // Particle struct: position: vec2<f32>, velocity: vec2<f32>
    const particleFields: StructField[] = [
        {name: 'position', type: 'vec2<f32>', size: 8, alignment: 8, offset: 0},
        {name: 'velocity', type: 'vec2<f32>', size: 8, alignment: 8, offset: 8},
    ];

    // Cell struct: state: u32
    const cellFields: StructField[] = [
        {name: 'state', type: 'u32', size: 4, alignment: 4, offset: 0},
    ];

    it('writes multi-field struct from JSON data', () => {
        const structSize = 16; // 2x vec2<f32>
        const buffer = new ArrayBuffer(structSize);
        const view = new DataView(buffer);
        const instance = multiFieldJson[0]; // { "0": [0.5, 0.5], "1": [0.1, -0.2] }

        const getValue = (fieldIndex: number, componentIndex: number, count: number) => {
            const fieldValue = instance[fieldIndex.toString() as keyof typeof instance];
            return resolveFieldValue(fieldValue, componentIndex, count);
        };

        writeStructInstance(view, 0, particleFields, getValue);

        expect(view.getFloat32(0, true)).toBeCloseTo(0.5);   // position.x
        expect(view.getFloat32(4, true)).toBeCloseTo(0.5);   // position.y
        expect(view.getFloat32(8, true)).toBeCloseTo(0.1);   // velocity.x
        expect(view.getFloat32(12, true)).toBeCloseTo(-0.2); // velocity.y
    });

    it('writes single-field struct from JSON data', () => {
        const structSize = 4;
        const buffer = new ArrayBuffer(structSize * singleFieldJson.length);
        const view = new DataView(buffer);

        for (let i = 0; i < singleFieldJson.length; i++) {
            const value = singleFieldJson[i];
            const getValue = (_fieldIndex: number, _componentIndex: number, _count: number) => {
                return resolveFieldValue(value, _componentIndex, _count);
            };
            writeStructInstance(view, i * structSize, cellFields, getValue);
        }

        // singleFieldJson = [1, 0, 1, 1, 0, 0, 1, 0, 1]
        expect(view.getUint32(0, true)).toBe(1);
        expect(view.getUint32(4, true)).toBe(0);
        expect(view.getUint32(8, true)).toBe(1);
        expect(view.getUint32(12, true)).toBe(1);
        expect(view.getUint32(16, true)).toBe(0);
        expect(view.getUint32(20, true)).toBe(0);
        expect(view.getUint32(24, true)).toBe(1);
        expect(view.getUint32(28, true)).toBe(0);
        expect(view.getUint32(32, true)).toBe(1);
    });

    it('writes multiple particle instances at correct offsets', () => {
        const structSize = 16;
        const count = multiFieldJson.length; // 4 particles
        const buffer = new ArrayBuffer(structSize * count);
        const view = new DataView(buffer);

        for (let i = 0; i < count; i++) {
            const instance = multiFieldJson[i];
            const getValue = (fieldIndex: number, componentIndex: number, cnt: number) => {
                const fieldValue = instance[fieldIndex.toString() as keyof typeof instance];
                return resolveFieldValue(fieldValue, componentIndex, cnt);
            };
            writeStructInstance(view, i * structSize, particleFields, getValue);
        }

        // Particle 0: pos=[0.5, 0.5], vel=[0.1, -0.2]
        expect(view.getFloat32(0, true)).toBeCloseTo(0.5);
        expect(view.getFloat32(4, true)).toBeCloseTo(0.5);
        expect(view.getFloat32(8, true)).toBeCloseTo(0.1);
        expect(view.getFloat32(12, true)).toBeCloseTo(-0.2);

        // Particle 1: pos=[0.3, 0.7], vel=[-0.1, 0.0]
        expect(view.getFloat32(16, true)).toBeCloseTo(0.3);
        expect(view.getFloat32(20, true)).toBeCloseTo(0.7);
        expect(view.getFloat32(24, true)).toBeCloseTo(-0.1);
        expect(view.getFloat32(28, true)).toBeCloseTo(0.0);

        // Particle 2: pos=[0.0, 1.0], vel=[0.0, 0.5]
        expect(view.getFloat32(32, true)).toBeCloseTo(0.0);
        expect(view.getFloat32(36, true)).toBeCloseTo(1.0);
        expect(view.getFloat32(40, true)).toBeCloseTo(0.0);
        expect(view.getFloat32(44, true)).toBeCloseTo(0.5);

        // Particle 3: pos=[0.8, 0.2], vel=[0.3, -0.1]
        expect(view.getFloat32(48, true)).toBeCloseTo(0.8);
        expect(view.getFloat32(52, true)).toBeCloseTo(0.2);
        expect(view.getFloat32(56, true)).toBeCloseTo(0.3);
        expect(view.getFloat32(60, true)).toBeCloseTo(-0.1);
    });

    it('handles missing instances by writing zeros', () => {
        const structSize = 16;
        const buffer = new ArrayBuffer(structSize);
        const view = new DataView(buffer);

        // Simulate a particle beyond the JSON array length (instance is null)
        const getValue = (_fieldIndex: number, _componentIndex: number, _count: number) => {
            return resolveFieldValue(null, _componentIndex, _count);
        };

        writeStructInstance(view, 0, particleFields, getValue);

        expect(view.getFloat32(0, true)).toBe(0);
        expect(view.getFloat32(4, true)).toBe(0);
        expect(view.getFloat32(8, true)).toBe(0);
        expect(view.getFloat32(12, true)).toBe(0);
    });
});

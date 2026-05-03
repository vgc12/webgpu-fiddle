import {describe, expect, it} from 'vitest';
import {
    alignTo,
    getWorkgroupSize,
    injectUniformsIntoShader,
    parseAllStructsFromWGSL,
    getStructFromBufferBinding,
} from './shader-builder.tsx';

describe('getWorkgroupSize', () => {
    it('parses 1D workgroup size', () => {
        const shader = '@workgroup_size(128)\nfn main() {}';
        expect(getWorkgroupSize(shader)).toEqual([128, 1, 1]);
    });

    it('parses 2D workgroup size', () => {
        const shader = '@workgroup_size(8, 8)\nfn main() {}';
        expect(getWorkgroupSize(shader)).toEqual([8, 8, 1]);
    });

    it('parses 3D workgroup size', () => {
        const shader = '@workgroup_size(4, 4, 4)\nfn main() {}';
        expect(getWorkgroupSize(shader)).toEqual([4, 4, 4]);
    });

    it('returns default [64, 1, 1] when no workgroup_size found', () => {
        const shader = 'fn main() {}';
        expect(getWorkgroupSize(shader)).toEqual([64, 1, 1]);
    });

    it('handles whitespace in workgroup_size', () => {
        const shader = '@workgroup_size( 16 , 16 )\nfn main() {}';
        expect(getWorkgroupSize(shader)).toEqual([16, 16, 1]);
    });
});

describe('alignTo', () => {
    it('returns same offset if already aligned', () => {
        expect(alignTo(16, 16)).toBe(16);
    });

    it('rounds up to next alignment boundary', () => {
        expect(alignTo(5, 4)).toBe(8);
    });

    it('handles offset 0', () => {
        expect(alignTo(0, 16)).toBe(0);
    });

    it('aligns to 8-byte boundary', () => {
        expect(alignTo(4, 8)).toBe(8);
    });

    it('aligns vec3 with 16-byte alignment after f32', () => {
        // f32 at offset 0 (size 4), vec3 needs alignment 16
        expect(alignTo(4, 16)).toBe(16);
    });
});

describe('parseAllStructsFromWGSL', () => {
    it('parses a simple struct with scalar fields', () => {
        const wgsl = `struct Particle {
    x: f32,
    y: f32,
}`;
        const structs = parseAllStructsFromWGSL(wgsl);
        const particle = structs.get('Particle');

        expect(particle).toBeDefined();
        expect(particle!.name).toBe('Particle');
        expect(particle!.fields).toHaveLength(2);
        expect(particle!.fields[0]).toMatchObject({name: 'x', type: 'f32', offset: 0, size: 4});
        expect(particle!.fields[1]).toMatchObject({name: 'y', type: 'f32', offset: 4, size: 4});
        expect(particle!.size).toBe(8);
    });

    it('applies correct alignment for vec3 fields', () => {
        const wgsl = `struct Data {
    a: f32,
    b: vec3<f32>,
}`;
        const structs = parseAllStructsFromWGSL(wgsl);
        const data = structs.get('Data');

        expect(data).toBeDefined();
        // f32 at 0, vec3 needs 16-byte alignment so offset = 16
        expect(data!.fields[0]).toMatchObject({name: 'a', offset: 0, size: 4, alignment: 4});
        expect(data!.fields[1]).toMatchObject({name: 'b', offset: 16, size: 12, alignment: 16});
        // Total: 16 + 12 = 28, rounded up to 32 (alignment 16)
        expect(data!.size).toBe(32);
    });

    it('parses multiple structs', () => {
        const wgsl = `
struct A { x: f32 }
struct B { y: u32, z: i32 }`;
        const structs = parseAllStructsFromWGSL(wgsl);
        expect(structs.size).toBe(2);
        expect(structs.has('A')).toBe(true);
        expect(structs.has('B')).toBe(true);
    });

    it('calculates vec2 alignment correctly', () => {
        const wgsl = `struct Uniforms {
    resolution: vec2f,
    mousePosition: vec2f,
    aspectRatio: f32,
    time: f32,
}`;
        const structs = parseAllStructsFromWGSL(wgsl);
        const uniforms = structs.get('Uniforms');

        expect(uniforms).toBeDefined();
        expect(uniforms!.fields[0]).toMatchObject({name: 'resolution', offset: 0, size: 8});
        expect(uniforms!.fields[1]).toMatchObject({name: 'mousePosition', offset: 8, size: 8});
        expect(uniforms!.fields[2]).toMatchObject({name: 'aspectRatio', offset: 16, size: 4});
        expect(uniforms!.fields[3]).toMatchObject({name: 'time', offset: 20, size: 4});
        expect(uniforms!.size).toBe(24);
    });

    it('returns empty map for code with no structs', () => {
        const structs = parseAllStructsFromWGSL('fn main() {}');
        expect(structs.size).toBe(0);
    });
});


describe('getStructFromBufferBinding', () => {
    it('finds struct from uniform binding', () => {
        const wgsl = `
struct MyData { a: f32, b: f32 }
@group(0) @binding(0) var<uniform> data: MyData;`;
        const result = getStructFromBufferBinding(wgsl, 'data');

        expect(result).not.toBeNull();
        expect(result!.name).toBe('MyData');
        expect(result!.fields).toHaveLength(2);
    });

    it('finds struct from storage buffer with array type', () => {
        const wgsl = `
struct Particle { pos: vec2<f32>, vel: vec2<f32> }
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;`;
        const result = getStructFromBufferBinding(wgsl, 'particles');

        expect(result).not.toBeNull();
        expect(result!.name).toBe('Particle');
    });

    it('returns null for non-existent binding', () => {
        const wgsl = `struct Foo { x: f32 }`;
        const result = getStructFromBufferBinding(wgsl, 'missing');
        expect(result).toBeNull();
    });
});

describe('injectUniformsIntoShader', () => {
    it('injects uniforms into a fragment shader', () => {
        const shader = `@fragment
fn main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
}`;
        const result = injectUniformsIntoShader(shader);

        expect(result.code).toContain('resolution = uniforms.resolution');
        expect(result.code).toContain('time = uniforms.time');
        expect(result.prefixLineCount).toBeGreaterThan(0);
    });

    it('injects into multiple entry points', () => {
        const shader = `@vertex
fn vertMain() -> @builtin(position) vec4<f32> {
    return vec4f(0);
}

@fragment
fn fragMain() -> @location(0) vec4<f32> {
    return vec4f(1);
}`;
        const result = injectUniformsIntoShader(shader);

        expect(result.injections).toHaveLength(2);
    });

    it('tracks injection metadata for line mapping', () => {
        const shader = `@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let x = 1;
}`;
        const result = injectUniformsIntoShader(shader);

        expect(result.injections).toHaveLength(1);
        expect(result.injections[0].linesAdded).toBeGreaterThan(0);
        expect(result.injections[0].atLine).toBeGreaterThan(0);
    });
});

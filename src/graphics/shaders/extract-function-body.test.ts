import {describe, expect, it} from 'vitest';
import {extractFunctionBody} from './extract-function-body.tsx';

describe('extractFunctionBody', () => {
    it('extracts body from function with return type', () => {
        const input = `fn main() -> vec4f {
    return vec4f(1.0);
}`;
        const body = extractFunctionBody(input);
        expect(body.trim()).toBe('return vec4f(1.0);');
    });

    it('extracts body from function with parameters and return type', () => {
        const input = `fn main(fragCoord: vec4<f32>) -> vec4<f32> {
    return fragCoord;
}`;
        const body = extractFunctionBody(input);
        expect(body.trim()).toBe('return fragCoord;');
    });

    it('extracts body from function without return type', () => {
        const input = `fn main() {
    let x = 1;
}`;
        const body = extractFunctionBody(input);
        expect(body.trim()).toBe('let x = 1;');
    });

    it('returns original code if no function wrapper found', () => {
        const input = 'let x = 1;\nlet y = 2;';
        const body = extractFunctionBody(input);
        expect(body).toBe(input);
    });

    it('extracts body from a named function', () => {
        const input = `fn compute() -> f32 {
    return 42.0;
}`;
        const body = extractFunctionBody(input, 'compute');
        expect(body.trim()).toBe('return 42.0;');
    });

    it('handles multiline function bodies', () => {
        const input = `fn main() -> vec4f {
    let r = 1.0;
    let g = 0.5;
    let b = 0.0;
    return vec4f(r, g, b, 1.0);
}`;
        const body = extractFunctionBody(input);
        expect(body).toContain('let r = 1.0;');
        expect(body).toContain('return vec4f(r, g, b, 1.0);');
    });
});

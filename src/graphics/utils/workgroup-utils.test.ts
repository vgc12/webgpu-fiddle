import {describe, expect, it} from 'vitest';
import {validateAndClampWorkgroupCount, calculateWorkgroupCount} from './workgroup-utils.tsx';

describe('validateAndClampWorkgroupCount', () => {
    it('passes through valid counts unchanged', () => {
        const result = validateAndClampWorkgroupCount([100, 100, 1], [8, 8, 1]);
        expect(result).toEqual([100, 100, 1]);
    });

    it('clamps counts exceeding 65535', () => {
        const result = validateAndClampWorkgroupCount([70000, 1, 1], [64, 1, 1]);
        expect(result).toEqual([65535, 1, 1]);
    });

    it('throws when workgroup size exceeds 256 total invocations', () => {
        expect(() =>
            validateAndClampWorkgroupCount([1, 1, 1], [32, 32, 1]) // 1024 invocations
        ).toThrow('exceeds max invocations');
    });

    it('accepts exactly 256 invocations', () => {
        const result = validateAndClampWorkgroupCount([10, 1, 1], [16, 16, 1]); // 256
        expect(result).toEqual([10, 1, 1]);
    });

    it('clamps all three dimensions independently', () => {
        const result = validateAndClampWorkgroupCount([70000, 70000, 70000], [1, 1, 1]);
        expect(result).toEqual([65535, 65535, 65535]);
    });
});

describe('calculateWorkgroupCount', () => {
    it('calculates 1D dispatch for 1D workgroup size', () => {
        const result = calculateWorkgroupCount(1000, [64, 1, 1]);
        // ceil(1000 / 64) = 16
        expect(result).toEqual([16, 1, 1]);
    });

    it('calculates 1D dispatch with exact division', () => {
        const result = calculateWorkgroupCount(256, [64, 1, 1]);
        expect(result).toEqual([4, 1, 1]);
    });

    it('calculates 2D dispatch for 2D workgroup size', () => {
        const result = calculateWorkgroupCount(10000, [8, 8, 1]);
        // gridSize = ceil(sqrt(10000)) = 100
        // x = ceil(100 / 8) = 13, y = ceil(100 / 8) = 13
        expect(result).toEqual([13, 13, 1]);
    });

    it('calculates 3D dispatch for 3D workgroup size', () => {
        const result = calculateWorkgroupCount(8000, [4, 4, 4]);
        // gridSize = ceil(cbrt(8000)) = 20
        // each dim = ceil(20/4) = 5
        expect(result).toEqual([5, 5, 5]);
    });

    it('handles small total counts', () => {
        const result = calculateWorkgroupCount(1, [64, 1, 1]);
        expect(result).toEqual([1, 1, 1]);
    });
});

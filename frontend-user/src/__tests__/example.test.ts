import { describe, it, expect } from '@jest/globals';

describe('Example Test Suite', () => {
    it('should add two numbers correctly', () => {
        expect(1 + 1).toBe(2);
    });

    it('should handle string concatenation', () => {
        const result = 'Hello' + ' ' + 'World';
        expect(result).toBe('Hello World');
    });

    it('should work with arrays', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
        expect(arr).toContain(2);
    });

    it('should work with objects', () => {
        const obj = { name: 'Test', value: 42 };
        expect(obj).toHaveProperty('name');
        expect(obj.value).toBe(42);
    });
});

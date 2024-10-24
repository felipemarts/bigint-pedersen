"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pedersen_1 = __importDefault(require("../pedersen"));
describe('isPrimeMillerRabin', () => {
    // Test case to ensure the primality test correctly identifies a small prime
    test('returns true for safe prime 11', () => {
        const p = 11n;
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeTruthy();
    });
    // Test case for another small known prime number
    test('returns true for safe prime 23', () => {
        const p = 23n;
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeTruthy();
    });
    // Test to confirm functionality with an additional small prime
    test('returns true for safe prime 47', () => {
        const p = 47n;
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeTruthy();
    });
    // Test with a larger prime to verify the test's scalability
    test('returns true for safe prime 999983', () => {
        const p = 999983n;
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeTruthy();
    });
    // Verifies non-prime detection with a composite number
    test('returns false for non-safe prime 15', () => {
        const p = 15n; // 15 is not a prime number
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeFalsy();
    });
    // Another test to ensure proper identification of non-prime numbers
    test('returns false for non-prime 20', () => {
        const p = 20n;
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeFalsy();
    });
    // Test to detect wrong categorization of a composite number
    test('returns false for non-safe prime 24', () => {
        const p = 24n; // 24 is not a prime number
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeFalsy();
    });
});
describe('pedersen', () => {
    // Test to check commitment calculation with small parameter values
    test('generate pedersen commitment small values', () => {
        const smallParans = {
            p: 101n,
            g: 2n,
            h: 5n,
        };
        const m1 = 10n;
        const r1 = 7n;
        const C = pedersen_1.default.commitment(m1, r1, smallParans);
        expect(C).toEqual(21n);
    });
    // Test to confirm Pedersen parameter generation and validity checks
    test('should generate valid Pedersen parameters', async () => {
        const { g, h, p } = await pedersen_1.default.generator(32);
        // Ensure parameters are of the correct type
        expect(typeof g).toBe('bigint');
        expect(typeof h).toBe('bigint');
        expect(typeof p).toBe('bigint');
        // Ensure generated parameters have the correct properties
        expect(g).not.toBe(h);
        // Validation of g as a generator
        const orderCondition = pedersen_1.default.modExp(g, (p - 1n) / 2n, p);
        expect(orderCondition).not.toBe(1n);
        // Confirm the primality of the generated value p
        expect(pedersen_1.default.isPrimeMillerRabin(p)).toBeTruthy();
    });
    // Test to verify 'h' is distinct from 'g' and '1' in generated parameters.
    test('should properly select h distinct from g and 1', async () => {
        for (let i = 0; i < 5; i++) { // Repeated tests for reliability
            const { g, h, p } = await pedersen_1.default.generator(32);
            // Check distinction of h from g and 1
            expect(h).not.toEqual(g);
            expect(h).not.toEqual(1n);
        }
    });
    // Test to validate homomorphic properties in commitment summation 
    test('homomorphic sum property', () => {
        const parans = pedersen_1.default.DEFAULT_GENERRATOR;
        const m1 = 10n;
        const r1 = pedersen_1.default.randomBlinding();
        const C1 = pedersen_1.default.commitment(m1, r1, parans);
        const m2 = 4n;
        const r2 = pedersen_1.default.randomBlinding();
        const C2 = pedersen_1.default.commitment(m2, r2, parans);
        const Csum = pedersen_1.default.sum(C1, C2, parans);
        // Calculate resulting message and randomness
        const m3 = 4n + 10n;
        const r3 = (r1 + r2) % parans.p;
        const C3 = pedersen_1.default.commitment(m3, r3, parans);
        // Ensure commitments and their sums behave as expected
        expect(C1).not.toEqual(C2);
        expect(C1).not.toEqual(C3);
        expect(C2).not.toEqual(C3);
        expect(Csum).toEqual(C3);
    });
    // Test to validate homomorphic properties in commitment subtraction
    test('homomorphic subtraction property', () => {
        const parans = pedersen_1.default.DEFAULT_GENERRATOR;
        const m1 = 50n;
        const r1 = pedersen_1.default.randomBlinding();
        const C1 = pedersen_1.default.commitment(m1, r1, parans);
        const m2 = 10n;
        const r2 = r1 / 3n; // Prevent r from being less than zero
        const C2 = pedersen_1.default.commitment(m2, r2, parans);
        const Csub = pedersen_1.default.sub(C1, C2, parans);
        // Calculate resulting message and randomness after subtraction
        const m3 = 50n - 10n;
        const r3 = r1 - r2;
        const C3 = pedersen_1.default.commitment(m3, r3, parans);
        // Validate the correctness of subtraction
        expect(C1).not.toEqual(C2);
        expect(C1).not.toEqual(C3);
        expect(C2).not.toEqual(C3);
        expect(Csub).toEqual(C3);
    });
    // Test to validate homomorphic properties in commitment multiplication 
    test('homomorphic multiply property', () => {
        const parans = pedersen_1.default.DEFAULT_GENERRATOR;
        const m1 = 33n;
        const r1 = pedersen_1.default.randomBlinding();
        const C1 = pedersen_1.default.commitment(m1, r1, parans);
        const scalar = 7n;
        const Cmul = pedersen_1.default.multiply(C1, scalar, parans);
        // Calculate resulting message and randomness after multiplication
        const m2 = 33n * scalar;
        const r2 = (r1 * scalar) % parans.p;
        const C2 = pedersen_1.default.commitment(m2, r2, parans);
        // Validate the correctness of multiplication
        expect(C1).not.toEqual(C2);
        expect(Cmul).toEqual(C2);
    });
});

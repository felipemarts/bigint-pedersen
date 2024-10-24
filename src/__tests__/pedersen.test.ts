import pedersen from '../pedersen'

describe('isPrimeMillerRabin', () => {

    test('returns true for safe prime 11', () => {
        const p = 11n;
        expect(pedersen.isPrimeMillerRabin(p)).toBeTruthy();
    });

    test('returns true for safe prime 23', () => {
        const p = 23n;
        expect(pedersen.isPrimeMillerRabin(p)).toBeTruthy();
    });

    test('returns true for safe prime 47', () => {
        const p = 47n;
        expect(pedersen.isPrimeMillerRabin(p)).toBeTruthy();
    });

    test('returns true for safe prime 999983', () => {
        const p = 999983n;
        expect(pedersen.isPrimeMillerRabin(p)).toBeTruthy();
    });

    test('returns false for non-safe prime 15', () => {
        const p = 15n; // 15 -1 / 2 = 7 -> Even though 7 is prime, 15 is not
        expect(pedersen.isPrimeMillerRabin(p)).toBeFalsy();
    });

    test('returns false for non-prime 20', () => {
        const p = 20n; // 20 is not a prime number
        expect(pedersen.isPrimeMillerRabin(p)).toBeFalsy();
    });

    test('returns false for non-safe prime 24', () => {
        const p = 24n; // 24 - 1 / 2 = 11.5 -> not an integer and 24 is not prime
        expect(pedersen.isPrimeMillerRabin(p)).toBeFalsy();
    });
});

describe('pedersen', () => {

    test('generate pedersen commitment small values', () => {
        const smallParans = {
            p: 101n,
            g: 2n,
            h: 5n,
        }

        const m1 = 10n;
        const r1 = 7n;

        const C = pedersen.commitment(m1, r1, smallParans);
        expect(C).toEqual(21n);
    });

    test('should generate valid Pedersen parameters', async () => {
        const { g, h, p } = await pedersen.generator(32);

        // Check if g, h, and p are of type bigint
        expect(typeof g).toBe('bigint');
        expect(typeof h).toBe('bigint');
        expect(typeof p).toBe('bigint');

        // Check that g and h are distinct
        expect(g).not.toBe(h);

        // Validate that p is a safe prime
        expect(pedersen.isPrimeMillerRabin(p)).toBeTruthy();
    });

    test('homomorphic sum property', () => {
        const parans = pedersen.DEFAULT_GENERRATOR;

        const m1 = 10n;
        const r1 = 7n;
        const C1 = pedersen.commitment(m1, r1, parans);

        const m2 = 4n;
        const r2 = 330n;
        const C2 = pedersen.commitment(m2, r2, parans);

        const Csum = pedersen.sum(C1, C2, parans);

        const m3 = 4n + 10n;
        const r3 = 330n + 7n;
        const C3 = pedersen.commitment(m3, r3, parans);

        expect(C1).not.toEqual(C2);
        expect(C1).not.toEqual(C3);
        expect(C2).not.toEqual(C3);
        expect(Csum).toEqual(C3);
    });

    test('homomorphic subtraction property', () => {
        const parans = pedersen.DEFAULT_GENERRATOR;

        const m1 = 50n;
        const r1 = 330n;
        const C1 = pedersen.commitment(m1, r1, parans);

        const m2 = 10n;
        const r2 = 7n;
        const C2 = pedersen.commitment(m2, r2, parans);

        const Csub = pedersen.sub(C1, C2, parans);

        const m3 = 50n - 10n;
        const r3 = 330n - 7n;
        const C3 = pedersen.commitment(m3, r3, parans);

        expect(C1).not.toEqual(C2);
        expect(C1).not.toEqual(C3);
        expect(C2).not.toEqual(C3);
        expect(Csub).toEqual(C3);
    });

    test('homomorphic multiply property', () => {
        const parans = pedersen.DEFAULT_GENERRATOR;

        const m1 = 33n;
        const r1 = 330n;
        const C1 = pedersen.commitment(m1, r1, parans);

        const scalar = 7n;

        const Cmul = pedersen.multiply(C1, scalar, parans);

        const m2 = 33n * scalar;
        const r2 = 330n * scalar;
        const C2 = pedersen.commitment(m2, r2, parans);

        expect(C1).not.toEqual(C2);
        expect(Cmul).toEqual(C2);
    });
})
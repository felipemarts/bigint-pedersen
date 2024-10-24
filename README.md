# Pedersen Commitment Library

This library provides an implementation of Pedersen Commitments, a cryptographic technique widely used for creating non-interactive commitments with strong security properties like homomorphic addition, subtraction, and multiplication.

## Features

- **Miller-Rabin Primality Test**: Ensures prime numbers are correctly identified.
- **Pedersen Parameters Generation**: Generates valid Pedersen parameters including prime, generator, and secondary generator.
- **Homomorphic Properties**: Supports operations like addition, subtraction, and multiplication of commitments.
- **Secure Randomness**: Utilizes Node.js crypto module to generate secure random values for blinding.

## Installation

To use this library, you need to have Node.js installed. Run the following command to install the package:

```bash
npm install bigint-pedersen
```

## Usage

Here is a simple example to demonstrate how to create a Pedersen Commitment and use its homomorphic sum property:

### Creating a Commitment

```typescript
import pedersen from 'bigint-pedersen';

// Generate Pedersen parameters
const parans = await pedersen.generator(2048); // 2048-bit safety

// Create a commitment for a message
const message1 = 42n;
const randomness1 = pedersen.randomBlinding();
const commitment1 = pedersen.commitment(message1, randomness1, parans);

console.log(`Commitment1: ${commitment1}`);
```

### Homomorphic Sum of Commitments

Here is how you can sum two commitments homomorphically:

```typescript
// Create a second commitment
const message2 = 58n;
const randomness2 = pedersen.randomBlinding();
const commitment2 = pedersen.commitment(message2, randomness2, parans);

console.log(`Commitment2: ${commitment2}`);

// Sum the commitments
const commitmentSum = pedersen.sum(commitment1, commitment2, parans);

console.log(`Sum of Commitments: ${commitmentSum}`);
```

In this example, the result `commitmentSum` is a valid commitment of the sum of the original messages (`message1 + message2`), demonstrating the library's homomorphic properties.

## API Reference

### Functions

- **`isPrimeMillerRabin(n: bigint, k?: number): boolean`**  
  Performs the Miller-Rabin primality test on `n`.

- **`generator(bits: number): Promise<PedersenParameters>`**  
  Generates Pedersen parameters including a prime `p` and generators `g` and `h`.

- **`commitment(m: bigint, r: bigint, parans: PedersenParameters): bigint`**  
  Computes a Pedersen commitment for the message `m` and randomness `r`.

- **`sum(C1: bigint, C2: bigint, parans: PedersenParameters): bigint`**  
  Computes the sum of two commitments `C1` and `C2`.

- **`sub(C1: bigint, C2: bigint, parans: PedersenParameters): bigint`**  
  Computes the difference between two commitments `C1` and `C2`.

- **`multiply(C: bigint, scalar: bigint, parans: PedersenParameters): bigint`**  
  Multiplies a commitment `C` by a scalar value.

## Tests

To run the tests for this project, use the following command:

```bash
npm run test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Utilizes the Node.js crypto module for random value generation.
- Implementation inspired by cryptographic primitives common in privacy-preserving protocols.

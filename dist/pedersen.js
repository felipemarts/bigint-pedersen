"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = __importDefault(require("node:crypto"));
// Default generators used for Pedersen commitments 2048 bits
const DEFAULT_GENERRATOR = {
    p: 26809931509713726881929393934746194494398623340254603267344709419072315601942996679555540094216756355587236678233714540569702209430523989668695021813296604437890318304359788997756314485945859269125843479737462443604463218788381902399300855449399051037396322952886267185109258359551031852192926751402739626602876508869021121415839940413096111104357546678095781175009153955498075194018858765387827742979958735349118653246917604244624611525479854815634983202466018180004575713519521591696136708240811991182516464514622975980528861723581513241904617248996258383305659058767475100110699861201638082703862378707771683885043n,
    g: 14694709048366479129464027221654552162231585341432931962377318999942025934847016287113843845082610438342648864596204292211352777789037554666373036583465555991725379195817880960645305237325952522104983034200148307024546428877657976287930346188512720597094142204247464293250761245519119779261723963273411146882744082830584412093129194118796879284756192200391645423685054939736140301881395757172570744218623286622834433154149349915432547599900923909164711329473795689863477689485764491526200309144296452310157008762664281605341910471190481559199002869295668843736566924026726713687853270832401989537050128451073524103513n,
    h: 17765657596489991520675714263237901296293034056124164028633004389675332209996154354074769630786877525226009800162272189681669177169877971481595221679593410270888654816821965825594128768184992784842796717465561468554274819536435420541299288366957240732633657201822781445626492161271460415863949862742927192243587494385007340884507735680421045822199369716080930777005181586841317821777963051535892442802540356934090568526043857667411907529156846977201816424784744487202893103864075486759926017748571705077898635217290146984276232360005039792235459612088121077743383116662969823420991352344697105133486412456447643502096n
};
// Computes base^exponent % mod using fast modular exponentiation
function modExp(base, exponent, mod) {
    let result = 1n;
    base = base % mod;
    while (exponent > 0n) {
        if (exponent & 1n) { // If exponent is odd
            result = (result * base) % mod;
        }
        exponent = exponent >>= 1n; // Divide exponent by 2
        base = (base * base) % mod;
    }
    return result;
}
// Miller-Rabin Primality Test to check if number n is prime
function isPrimeMillerRabin(n, k = 100) {
    if (n === 2n || n === 3n)
        return true;
    if (n < 2n || n % 2n === 0n)
        return false;
    // Write n - 1 as d * 2^r
    let d = n - 1n;
    let r = 0n;
    while (d % 2n === 0n) {
        d /= 2n;
        r += 1n;
    }
    // Witness loop
    for (let i = 0; i < k; i++) {
        const a = 2n + BigInt(Math.floor(Math.random() * (Number(n - 4n))));
        let x = modExp(a, d, n);
        if (x === 1n || x === n - 1n)
            continue;
        let continueOuterLoop = false;
        for (let j = 0n; j < r - 1n; j++) {
            x = modExp(x, 2n, n);
            if (x === n - 1n) {
                continueOuterLoop = true;
                break;
            }
        }
        if (!continueOuterLoop)
            return false;
    }
    return true;
}
// Generates a prime number with specified bit size
function generatePrime(bits) {
    return new Promise((resolve, reject) => {
        node_crypto_1.default.generatePrime(bits, { safe: true }, (err, prime) => {
            if (err)
                return reject(err);
            resolve(BigInt("0x" + Buffer.from(prime).toString("hex")));
        });
    });
}
// Produces a random bigint less than a provided modulus
function generateRandomBigInt(modulus) {
    const randomBytes = node_crypto_1.default.randomBytes(modulus.toString(2).length / 8);
    let randomValue = BigInt('0x' + randomBytes.toString('hex'));
    return randomValue % modulus;
}
// Generates a random value used for blinding a message
function randomBlinding(bytes = 32) {
    const randomBytes = node_crypto_1.default.randomBytes(bytes);
    let randomValue = BigInt('0x' + randomBytes.toString('hex'));
    return randomValue;
}
// Chooses a safe generator for a given prime p
async function chooseSafeGenerator(p) {
    let g;
    do {
        g = generateRandomBigInt(p);
    } while (!isGenerator(g, p)); // Ensure g is a valid generator.
    return g;
}
// Verifies if a given g is a generator for prime p
function isGenerator(g, p) {
    // Ensures g^(p-1)/2 % p is not 1
    const orderCondition = modExp(g, (p - 1n) / 2n, p);
    return orderCondition !== 1n; // True if g is a safe generator
}
// Generates Pedersen commitment parameters
async function generator(bits = 2048) {
    const p = await generatePrime(bits);
    const g = await chooseSafeGenerator(p);
    let h = generateRandomBigInt(p);
    // Ensure h is distinct from g and not equal to 1
    while (h === g || h === 1n) {
        h = generateRandomBigInt(p);
    }
    return { p, g, h };
}
// Computes modular inverse of a number modulo p
function modInverse(a, p) {
    let t = 0n;
    let newT = 1n;
    let r = p;
    let newR = a;
    while (newR !== 0n) {
        const quotient = r / newR;
        [t, newT] = [newT, t - quotient * newT];
        [r, newR] = [newR, r - quotient * newR];
    }
    if (r > 1n) {
        throw new Error(`${a} is not invertible`);
    }
    if (t < 0n) {
        t = t + p;
    }
    return t;
}
// Creates a commitment for a message m with randomness r
function commitment(m, r, parans) {
    if (m < 0n)
        throw new Error(`m cannot be less than zero - ${m}`);
    if (r < 0n)
        throw new Error(`r cannot be less than zero - ${r}`);
    const gm = modExp(parans.g, m, parans.p); // Compute g^m % p
    const hr = modExp(parans.h, r, parans.p); // Compute h^r % p
    const C = (gm * hr) % parans.p; // Resulting commitment
    return C;
}
// Adds two commitments
function sum(C1, C2, parans) {
    return (C1 * C2) % parans.p; // Sum of commitments is a modular multiplication
}
// Subtracts one commitment from another
function sub(C1, C2, parans) {
    return (C1 * modInverse(C2, parans.p)) % parans.p; // Subtraction involves modular inverse
}
// Multiplies a commitment by a scalar
function multiply(C, scalar, parans) {
    return modExp(C, scalar, parans.p); // Multiplication is a modular exponentiation
}
const pedersen = {
    DEFAULT_GENERRATOR,
    modExp,
    modInverse,
    randomBlinding,
    isPrimeMillerRabin,
    generator,
    commitment,
    sum,
    sub,
    multiply,
};
exports.default = pedersen;

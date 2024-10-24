import crypto from 'node:crypto';

export type PedersenParameters = {
    g: bigint,
    h: bigint,
    p: bigint
}

const DEFAULT_GENERRATOR = {
    p: 31874700074135489080855646261973920041525033205342095874311350991615728470228230425948649048947535840097488800213735506678050721897036224322045884949035082211563583856555620383957259380529853002910485516379789906034148342207428673884290161169506265595344601567324264680576812499107754850280181518011521188055283211176547551657701745488918595117144022421255196852545678932343289845747773202263876522088084337729264236442011432450642528162617450376153453807423330736921957783820263987680132075096691919953277362269644141024892333948602724927533250280250116444104960255705659800177555550997805369975377583503845067585199n,
    g: 13279813010547432213451620068666226209459269082468049204907805067671349517244501808362381057556198571477038813658022998867251456972290950651314643282931462340522348899049095936398768104989945131731512078611312895913002649237514928606032804462555291644183053129465915980644359782073909849826580499870313674441613737262239247107395609124167900282630367104216318913293231709852902340052240417073062062003784537259825379164259030561799854055915689588801866661121211141734273524368424286465458343571350343344509813544155958894226916553247975907695474520024488371818172617439052593086916591210499490960843891680063023204404n,
    h: 19762650856013354556583729508913137753434110320818051292616054814745480557786369440413550481041813962383446980253881353973599593234179750835202530435518054997122584740921845749750314685928705621908678381751807077741426320115822079657825969389320279809461204665066444763087955822894577571142778073648225227038674559029005636312341537449244334424204737458717722108993643576337161304729655334461305800120936534644930570763362125843558036581035197223715130973297588556671348923087347762916256587085278552910891891908141011008063923578081901358577985812847727101297868403744804866601664297639298645162096974587308474347491n,
}

function modExp(base: bigint, exponent: bigint, mod: bigint): bigint {
    let result = 1n;
    base = base % mod;
    while (exponent > 0n) {
        if (exponent & 1n) {
            result = (result * base) % mod;
        }
        exponent = exponent >>= 1n;
        base = (base * base) % mod;
    }
    return result;
}

// Miller-Rabin Primality Test
function isPrimeMillerRabin(n: bigint, k: number = 100) {
    if (n === 2n || n === 3n) return true;
    if (n < 2n || n % 2n === 0n) return false;

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
        if (x === 1n || x === n - 1n) continue;

        let continueOuterLoop = false;
        for (let j = 0n; j < r - 1n; j++) {
            x = modExp(x, 2n, n);
            if (x === n - 1n) {
                continueOuterLoop = true;
                break;
            }
        }
        if (!continueOuterLoop) return false;
    }
    return true;
}

function generatePrime(bits: number): Promise<bigint> {
    return new Promise((resolve, reject) => {
        crypto.generatePrime(bits, { safe: true }, (err, prime) => {
            if (err) return reject(err);
            resolve(BigInt("0x" + Buffer.from(prime).toString("hex")));
        });
    });
}

function generateRandomBigInt(modulus: bigint): bigint {
    const randomBytes = crypto.randomBytes(modulus.toString(2).length / 8);
    let randomValue = BigInt('0x' + randomBytes.toString('hex'));
    return randomValue % modulus;
}

async function generator(bits = 2048): Promise<PedersenParameters> {
    const p = await generatePrime(bits);

    let g = 2n;
    let h = generateRandomBigInt(p);
    while (h === g || h === 1n) {
        h = generateRandomBigInt(p);
    }

    return { p, g, h };
}

function modInverse(a: bigint, p: bigint): bigint {
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

function commitment(m: bigint, r: bigint, parans: PedersenParameters): bigint {
    const gm = modExp(parans.g, m, parans.p);  // g^m % p
    const hr = modExp(parans.h, r, parans.p);  // h^r % p
    const C = (gm * hr) % parans.p;
    return C;
}

function sum(C1: bigint, C2: bigint, parans: PedersenParameters) {
    return (C1 * C2) % parans.p;
}

function sub(C1: bigint, C2: bigint, parans: PedersenParameters) {
    return (C1 * modInverse(C2, parans.p)) % parans.p;
}

function multiply(C: bigint, scalar: bigint, parans: PedersenParameters): bigint {
    return modExp(C, scalar, parans.p);
}

const pedersen = {
    DEFAULT_GENERRATOR,
    isPrimeMillerRabin,
    generator,
    commitment,
    sum,
    sub,
    multiply,
}

export default pedersen;
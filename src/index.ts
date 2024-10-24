import pedersen from './pedersen'

export * from './pedersen'

pedersen.generator().then(g => console.log(g))
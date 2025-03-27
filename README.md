# garbage

Generate garbage. What is garbage? Garbage is anything. Just objects, errors, proxies, promises,
typed arrays, symbols, anything really that you'd want to sanity-test with. Feed garbage
to something and see how that-something behaves to fuzz out potential problems. Garbage depth
is random, content is random, it's all random garbage.

## Install

```bash
npm install @opsimathically/garbage
```

## Building from source

This package is intended to be run via npm, but if you'd like to build from source,
clone this repo, enter directory, and run `npm install` for dev dependencies, then run
`npm run build`.

## Usage

[See API Reference for documentation](https://github.com/opsimathically/garbage/blob/main/docs/)

[See unit tests for a usage example](https://github.com/opsimathically/garbage/blob/main/test/garbage.test.ts)

```typescript
import { generateRandomGarbage } from '@opsimathically/garbage';
const any_garbage: any = generateRandomGarbage();
console.log(any_garbage);
```

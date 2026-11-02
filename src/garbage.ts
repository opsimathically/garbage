/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'crypto';

type AnyObject = { [key: string | symbol]: any };
type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

const randomInt = (max: number) => Math.floor(Math.random() * max);
const randomBool = () => Math.random() < 0.5;
const randomString = () =>
  Math.random().toString(36).slice(2) + randomBytes(4).toString('hex');
const randomSymbol = () => Symbol(randomString());
const randomBigint = () => BigInt(randomInt(1e6)) ** BigInt(randomInt(10));
const randomFloat = () => Math.random() * Number.MAX_SAFE_INTEGER;

function randomPrimitive() {
  const choices = [
    null,
    undefined,
    randomBool(),
    randomInt(1e6),
    randomFloat(),
    randomString(),
    randomSymbol(),
    randomBigint()
  ];
  return choices[randomInt(choices.length)];
}

function randomFunction(): Function {
  return (...args: any[]) => ({
    called_with: args,
    value: Math.random()
  });
}

function randomBuffer(): Buffer {
  return randomBytes(randomInt(32) + 1);
}

function randomTypedArray(): TypedArray | DataView {
  const len = randomInt(20) + 1;
  const types = [
    () => new Int8Array(len),
    () => new Uint8Array(len),
    () => new Int16Array(len),
    () => new Uint16Array(len),
    () => new Int32Array(len),
    () => new Uint32Array(len),
    () => new Float32Array(len),
    () => new Float64Array(len),
    () => new DataView(new ArrayBuffer(len))
  ];
  return types[randomInt(types.length)]();
}

function randomPromise(): Promise<any> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(randomPrimitive()), randomInt(10))
  );
}

function randomError(): Error {
  const errors = [
    () => new Error(randomString()),
    () => new TypeError(randomString()),
    () => new SyntaxError(randomString()),
    () => new RangeError(randomString()),
    () => new ReferenceError(randomString()),
    () => new URIError(randomString()),
    () => new EvalError(randomString())
  ];
  return errors[randomInt(errors.length)]();
}

function maybeProxy<T extends object>(target: T): T {
  if (!randomBool()) return target;
  return new Proxy(target, {
    get: (obj, prop) => {
      if (prop === Symbol.toStringTag) return 'Proxy';
      return Reflect.get(obj, prop);
    },
    set: (obj, prop, value) => Reflect.set(obj, prop, value),
    has: (obj, prop) => Reflect.has(obj, prop),
    ownKeys: (obj) => Reflect.ownKeys(obj),
    getOwnPropertyDescriptor: (obj, prop) =>
      Object.getOwnPropertyDescriptor(obj, prop) ?? {
        configurable: true,
        enumerable: true
      }
  });
}

function maybeProxySet<T>(
  target: Set<T>,
  handler: Partial<ProxyHandler<Set<T>>> = {}
): Set<T> {
  if (!randomBool()) return target;
  // maybe proxy with bad set/get etc (this will cause things like set.add() to fail with errors)
  if (!randomBool()) return maybeProxy(target);

  const setTraps: ProxyHandler<Set<T>> = {
    get(targetSet, prop, receiver) {
      const value = Reflect.get(targetSet, prop, receiver);
      if (typeof value === 'function') {
        return (...args: any[]) => {
          return (value as Function).apply(targetSet, args);
        };
      }
      return value;
    },
    ...handler
  };
  return new Proxy(target, setTraps);
}

function maybeProxyMap<K, V>(
  target: Map<K, V>,
  handler: Partial<ProxyHandler<Map<K, V>>> = {}
): Map<K, V> {
  if (!randomBool()) return target;
  // maybe proxy with bad values.
  if (!randomBool()) return maybeProxy(target);
  const mapTraps: ProxyHandler<Map<K, V>> = {
    get(targetMap, prop, receiver) {
      const value = Reflect.get(targetMap, prop, receiver);
      if (typeof value === 'function') {
        return (...args: any[]) => {
          return (value as Function).apply(targetMap, args);
        };
      }
      return value;
    },
    ...handler
  };

  return new Proxy(target, mapTraps);
}

function generateGarbage(
  depth = 0,
  visited = new WeakSet(),
  history: any[] = []
): any {
  if (depth > 6 || randomBool()) return randomPrimitive();

  if (history.length > 0 && randomInt(10) === 0) {
    return history[randomInt(history.length)];
  }

  const generators = [
    () => {
      const arr: any[] = [];
      visited.add(arr);
      history.push(arr);
      for (let i = 0; i < randomInt(4) + 1; i++) {
        arr.push(generateGarbage(depth + 1, visited, history));
      }
      return maybeProxy(arr);
    },
    () => {
      const obj: AnyObject = {};
      visited.add(obj);
      history.push(obj);
      for (let i = 0; i < randomInt(4) + 1; i++) {
        const raw_key = generateGarbage(depth + 1, visited, history);
        let key: string | symbol;

        if (typeof raw_key === 'symbol') {
          key = raw_key;
        } else {
          try {
            key = String(raw_key);
          } catch {
            // fallback if something deeply weird like a Proxy throws
            key = randomString();
          }
        }
        obj[key] = generateGarbage(depth + 1, visited, history);
      }
      return maybeProxy(obj);
    },
    () => {
      const map = new Map<any, any>();
      visited.add(map);
      history.push(map);
      for (let i = 0; i < randomInt(4) + 1; i++) {
        map.set(
          generateGarbage(depth + 1, visited, history),
          generateGarbage(depth + 1, visited, history)
        );
      }
      return maybeProxyMap(map);
    },
    () => {
      const set = new Set<any>();
      visited.add(set);
      history.push(set);
      for (let i = 0; i < randomInt(4) + 1; i++) {
        set.add(generateGarbage(depth + 1, visited, history));
      }
      return maybeProxySet(set);
    },
    () => randomFunction(),
    () => randomBuffer(),
    () => randomTypedArray(),
    () => randomPromise(),
    () => randomError()
  ];

  const pick = generators[randomInt(generators.length)];
  return pick();
}

export function generateRandomGarbage(): any {
  return generateGarbage(0);
}

/* THE INHERITANCE 3D — model registry. */
import * as A from './models_arch.js';
import * as T from './models_tech.js';

const LIB = { ...A, ...T };
const cache = new Map();
// Build a fresh holographic instance of a named model (geometry is shared).
export function model(name, opts = {}) {
  let mb = cache.get(name);
  if (!mb) { mb = LIB[name](); cache.set(name, mb); }
  return mb.build(opts);
}
export function modelFrom(name, arg, opts = {}) {
  const key = name + ':' + arg;
  let mb = cache.get(key);
  if (!mb) { mb = LIB[name](arg); cache.set(key, mb); }
  return mb.build(opts);
}
export { LIB };

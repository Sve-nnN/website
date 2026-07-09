export const deepMerge = <T extends object, U extends object>(obj1: T, obj2: U): T & U => {
  const result = { ...obj1 } as T & U;
  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      const val2 = obj2[key];
      const val1 = result[key];
      if (isObject(val1) && isObject(val2)) {
        (result as Record<string, unknown>)[key] = deepMerge(val1, val2);
      } else {
        (result as Record<string, unknown>)[key] = val2;
      }
    }
  }
  return result;
};

const isObject = (item: unknown): item is object => {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
};

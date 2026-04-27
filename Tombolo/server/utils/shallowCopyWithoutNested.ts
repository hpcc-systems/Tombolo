type ShallowCopyWithoutNestedValue<T> = T extends object ? null : T;

type ShallowCopyWithoutNestedResult<T extends Record<string, unknown>> = {
  [K in keyof T]: ShallowCopyWithoutNestedValue<T[K]>;
};

const shallowCopyWithoutNested = <T extends Record<string, unknown>>(
  obj: T
): ShallowCopyWithoutNestedResult<T> => {
  const newObj = {} as ShallowCopyWithoutNestedResult<T>;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const typedKey = key as keyof T;
      const value = obj[typedKey];
      newObj[typedKey] =
        typeof value === 'object' && value !== null
          ? null
          : (value as ShallowCopyWithoutNestedResult<T>[typeof typedKey]);
    }
  }

  return newObj;
};

export default shallowCopyWithoutNested;

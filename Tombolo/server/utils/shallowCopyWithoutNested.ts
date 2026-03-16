const shallowCopyWithoutNested = (
  obj: Record<string, any>
): Record<string, any> => {
  const newObj: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] =
        typeof obj[key] === 'object' && obj[key] !== null ? null : obj[key];
    }
  }

  return newObj;
};

export default shallowCopyWithoutNested;

// Tests
// const original = { a: 1, b: { c: 2 }, d: 'hello' };
// const copy = shallowCopyWithoutNested(original);
// console.log(copy); // { a: 1, b: null, d: 'hello' }
// console.log(original); // { a: 1, b: { c: 2 }, d: 'hello' }

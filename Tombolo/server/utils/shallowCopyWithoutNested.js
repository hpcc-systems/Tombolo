const  shallowCopyWithoutNested = (obj) => {
  const newObj = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] =
        typeof obj[key] === "object" && obj[key] !== null ? null : obj[key];
    }
  }

  return newObj;
}

module.exports = shallowCopyWithoutNested;
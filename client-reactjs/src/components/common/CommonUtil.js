import { authHeader, handleError } from "./AuthHeader.js"
let omitDeep = (value, key) => {
  if (Array.isArray(value)) {
    return value.map(i => omitDeep(i, key))
  }
  else if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
      .reduce(
        (newObject, k) => {
          if (k == key) return newObject
          return Object.assign(
            { [k]: omitDeep(value[k], key) },
            newObject
          )
        },
        {}
      )
  }
  return value
}

const eclTypes = [
    "Boolean",
    "Integer",
    "Unsigned",
    "Real",
    "Decimal",
    "String",
    "Varstring",
    "RrcordOf",
    "Enum"
];

const fetchDataDictionary = (applicationId) => {
  return new Promise((resolve, reject) => {
    fetch("/api/data-dictionary?application_id="+applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {      
      resolve(data);
    }).catch(error => {
      console.log(error);
      reject(error);
    });
  })
}  

export {omitDeep, eclTypes, fetchDataDictionary};
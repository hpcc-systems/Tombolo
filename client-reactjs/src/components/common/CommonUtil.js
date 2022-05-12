let omitDeep = (value, key) => {
  if (Array.isArray(value)) {
    return value.map(i => omitDeep(i, key))
  }
  else if (typeof value === 'object' && value !== null) {
    return Object.keys(value)
      .reduce(
        (newObject, k) => {
          if (k === key) return newObject
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

const validationRules = [
  'Allowed Values', 
  'Not-Allowed Values', 
  'Empty_Check', 
  'Date_Check', 
  'Currency_Check', 
  'String_Check', 
  'Null_Check', 
  'Int_Check',
  'Invalid_IP_Check',
  'Invalid_State_Check',
  'Invalid_Credit_Card_Check',
  'Invalid_Email_Check',
  'Invalid_Phone_Num_Check',
  'Invalid_Zip_Code_Check',
  'Invalid_SSN_Check',
  'Begins With',
  'Equal',
  'In',
  'Not-In'
];

const validationRuleFixes = [
  'Drop Record',
  'Fix Date',
  'Convert to State Code',
  'Trim'
];


const flatten = (obj) => {
  const array = Array.isArray(obj) ? obj : [obj];
  return array.reduce((acc, value) => {
    acc.push(value);
    if (value.children) {
      acc = acc.concat(flatten(value.children));
      delete value.children;
    }
    return acc;
  }, []);
}

const formItemLayout = {
  labelCol: { span: 2 },
  wrapperCol: { span: 11 }
}

const formItemLayoutWithOutLabel = {
  wrapperCol: { span: 11 , offset: 2 }
};

const threeColformItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 12 }
};

//Label and input in different line
const multiLineFormItemLayout = {
  labelCol : {span : 24},
  wrapperCol : {span :6},
}


export {omitDeep, eclTypes,  flatten, formItemLayout, formItemLayoutWithOutLabel, threeColformItemLayout, multiLineFormItemLayout, validationRules, validationRuleFixes};
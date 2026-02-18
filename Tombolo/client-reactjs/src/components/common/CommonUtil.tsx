import React from 'react';
import { Tooltip } from 'antd';
import { Constants } from './Constants';

const omitDeep = (value: any, key: string): any => {
  if (Array.isArray(value)) {
    return value.map(i => omitDeep(i, key));
  } else if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce((newObject: any, k) => {
      if (k === key) return newObject;
      return Object.assign({ [k]: omitDeep(value[k], key) }, newObject);
    }, {});
  }
  return value;
};

const eclTypes = ['Boolean', 'Integer', 'Unsigned', 'Real', 'Decimal', 'String', 'Varstring', 'RrcordOf', 'Enum'];

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
  'Not-In',
];

const validationRuleFixes = ['Drop Record', 'Fix Date', 'Convert to State Code', 'Trim'];

const flatten = (obj: any) => {
  const array = Array.isArray(obj) ? obj : [obj];
  return array.reduce((acc: any[], value: any) => {
    acc.push(value);
    if (value.children) {
      acc = acc.concat(flatten(value.children));
      delete value.children;
    }
    return acc;
  }, []);
};

const flattenObject = (obj: Record<string, any>) => {
  const flattened: Record<string, any> = {};

  const _flatten = (object: Record<string, any>, prefix = '') => {
    Object.keys(object).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof object[key] === 'object' && object[key] !== null && !Array.isArray(object[key])) {
        _flatten(object[key], newKey);
      } else {
        flattened[newKey] = object[key];
      }
    });
  };

  _flatten(obj);
  return flattened;
};

const formItemLayout = {
  labelCol: { span: 2 },
  wrapperCol: { span: 11 },
};

const formItemLayoutWithOutLabel = {
  wrapperCol: { span: 11, offset: 2 },
};

const threeColformItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 12 },
};

const multiLineFormItemLayout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 6 },
};

export const getWorkingCopyGraph = (dataflowId: string) => {
  const raw = localStorage.getItem('tombolo_graph');
  const LSgraphs = raw ? JSON.parse(raw) : null;
  return LSgraphs?.[dataflowId];
};

export const saveWorkingCopyGraph = (dataflowId: string, graph: any) => {
  const raw = localStorage.getItem('tombolo_graph');
  const LSgraphs = raw ? JSON.parse(raw) : {};
  LSgraphs[dataflowId] = graph;
  localStorage.setItem('tombolo_graph', JSON.stringify(LSgraphs));
};

const camelToTitleCase = (string?: string) => {
  if (string) {
    let words = string.split(/(?=[A-Z])/);
    words = words.map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    return words.join(' ');
  } else {
    return '';
  }
};

const formatDateTime = (timestamp: any) => {
  const dateTime = new Date(timestamp);

  return (
    dateTime.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
    ' @ ' +
    dateTime.toLocaleTimeString('en-US', Constants.TIME_FORMAT_OPTIONS)
  );
};

const formatDateTimeShort = (timestamp: any) => {
  const dateTime = new Date(timestamp);

  return (
    dateTime.toLocaleDateString('en-US', Constants.COMPACT_DATE_FORMAT_OPTIONS) +
    ' @ ' +
    dateTime.toLocaleTimeString('en-US', Constants.TIME_FORMAT_OPTIONS)
  );
};

const DateWithTooltip: React.FC<{ timestamp: any }> = ({ timestamp }) => {
  const dateTime = new Date(timestamp);
  return (
    <Tooltip title={formatDateTime(dateTime)}>
      <span>{formatDateTimeShort(dateTime)}</span>
    </Tooltip>
  );
};

export {
  omitDeep,
  eclTypes,
  flatten,
  flattenObject,
  formItemLayout,
  formItemLayoutWithOutLabel,
  threeColformItemLayout,
  multiLineFormItemLayout,
  validationRules,
  validationRuleFixes,
  camelToTitleCase,
  formatDateTime,
  formatDateTimeShort,
  DateWithTooltip,
};

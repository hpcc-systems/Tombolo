import {
  regexBody,
  stringQuery,
  uuidQuery,
  regexQuery,
  queryUuids,
  booleanQuery,
  bodyUuids,
} from './commonMiddleware.js';

const looseKeywordRegex = /^[a-zA-Z0-9_. \-:*?]*$/;
const strictLetterRegex = /^[a-zA-Z]{1}[a-zA-Z0-9_: .-]*$/;
const digitFirstLetterRegex = /^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]*$/;

const keywordRegexBody = regexBody('keyword', false, {
  regex: looseKeywordRegex,
});

const fileDetailsShared = [
  stringQuery('fileName'),
  uuidQuery('clusterid', true, { checkFalsy: true }),
];

const validateFileSearch = [keywordRegexBody];

const validateSuperfileSearch = [keywordRegexBody];

const validateQuerySearch = [
  regexBody('keyword', false, { regex: strictLetterRegex }),
];

const validateJobSearch = [
  regexBody('keyword', false, { regex: strictLetterRegex }),
  bodyUuids.clusterId,
  regexBody('clusterType', true, { regex: strictLetterRegex }),
];

const validateGetLogicalFileDetails = [...fileDetailsShared];

const validateGetData = [
  queryUuids.clusterid,
  regexQuery('fileName', false, { regex: strictLetterRegex }),
];

const validateGetQueryFiles = [
  regexQuery('hpcc_queryId', false, { regex: strictLetterRegex }),
  queryUuids.clusterId,
];

const validateGetDropZones = [uuidQuery('clusterId')];

const validateDropZoneDirectoryDetails = [
  queryUuids.clusterId,
  stringQuery('Netaddr'),
  booleanQuery('DirectoryOnly'),
  stringQuery('Path'),
];

const validateDropZoneFileSearch = [
  bodyUuids.clusterId,
  regexBody('dropZoneName', false, { regex: digitFirstLetterRegex }),
  regexBody('server', false, { regex: /^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]/ }),
  regexBody('nameFilter', false, { regex: digitFirstLetterRegex }),
];

const validateGetSuperfileDetails = [
  stringQuery('fileName'),
  uuidQuery('clusterid', true, { checkFalsy: true }),
];

const validateClusterMetaData = [queryUuids.clusterId];

export {
  validateFileSearch,
  validateSuperfileSearch,
  validateQuerySearch,
  validateJobSearch,
  validateGetLogicalFileDetails,
  validateGetData,
  validateGetQueryFiles,
  validateGetDropZones,
  validateDropZoneDirectoryDetails,
  validateDropZoneFileSearch,
  validateGetSuperfileDetails,
  validateClusterMetaData,
};

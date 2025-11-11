const {
  regexBody,
  uuidBody,
  stringQuery,
  uuidQuery,
  regexQuery,
  queryUuids,
  booleanQuery,
  bodyUuids,
} = require('./commonMiddleware');

const looseKeywordRegex = /^[a-zA-Z0-9_. \-:\*\?]*$/;
const strictLetterRegex = /^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/;
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

// const validateGetFileInfo = [...fileDetailsShared, uuidQuery('applicationId')];

const validateGetLogicalFileDetails = [...fileDetailsShared];

// const validateGetIndexInfo = [
//   regexQuery('indexName', false, { regex: strictLetterRegex }),
//   queryUuids.clusterid,
//   queryUuids.applicationId,
// ];

const validateGetData = [
  queryUuids.clusterid,
  regexQuery('fileName', false, { regex: strictLetterRegex }),
];

// const validateGetQueryInfo = [
//   queryUuids.clusterid,
//   regexQuery('queryName', false, { regex: strictLetterRegex }),
// ];

const validateGetQueryFiles = [
  regexQuery('hpcc_queryId', false, { regex: strictLetterRegex }),
  queryUuids.clusterId,
];

// const validateGetJobInfo = [
//   queryUuids.clusterid,
//   regexQuery('jobWuid', false, { regex: strictLetterRegex }),
// ];

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

const validateExecuteSprayJob = [uuidBody('jobId')];

const validateClusterMetaData = [queryUuids.clusterId];

module.exports = {
  validateFileSearch,
  validateSuperfileSearch,
  validateQuerySearch,
  validateJobSearch,
  // validateGetFileInfo,
  validateGetLogicalFileDetails,
  // validateGetIndexInfo,
  validateGetData,
  // validateGetQueryInfo,
  validateGetQueryFiles,
  // validateGetJobInfo,
  validateGetDropZones,
  validateDropZoneDirectoryDetails,
  validateDropZoneFileSearch,
  validateGetSuperfileDetails,
  validateExecuteSprayJob,
  validateClusterMetaData,
};

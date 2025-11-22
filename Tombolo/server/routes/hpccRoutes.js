const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validateRequestBody');
const {
  validateFileSearch,
  validateSuperfileSearch,
  validateQuerySearch,
  validateGetLogicalFileDetails,
  validateGetData,
  validateGetQueryFiles,
  validateGetDropZones,
  validateDropZoneDirectoryDetails,
  validateDropZoneFileSearch,
  validateGetSuperfileDetails,
  validateClusterMetaData,
} = require('../middlewares/hpccMiddleware');

const {
  fileSearch,
  superfileSearch,
  querySearch,
  jobSearch,
  getClusters,
  getCluster,
  getLogicalFileDetails,
  hpccGetData,
  getFileProfile,
  getFileProfileHtml,
  getQueryFiles,
  getDropZones,
  getDropzoneDirectories,
  getDropzoneDirectoryDetails,
  dropzoneFileSearch,
  getSuperfileDetails,
  getClusterMetaData,
} = require('../controllers/hpccController');

router.post('/filesearch', validate(validateFileSearch), fileSearch);

router.post(
  '/superfilesearch',
  validate(validateSuperfileSearch),
  superfileSearch
);
router.post('/querysearch', validate(validateQuerySearch), querySearch);
router.post(
  '/jobsearch',
  // validate(validateJobSearch),
  jobSearch
);

router.get('/getClusters', getClusters);

router.get('/getCluster', getCluster);

// Gets file detail straight from HPCC regardless of whether it exists in Tombolo DB
router.get(
  '/getLogicalFileDetails',
  validate(validateGetLogicalFileDetails),
  getLogicalFileDetails
);

router.get('/getData', validate(validateGetData), hpccGetData);

router.get('/getFileProfile', getFileProfile);

router.get('/getFileProfileHTML', getFileProfileHtml);

router.get('/getQueryFiles', validate(validateGetQueryFiles), getQueryFiles);

router.get('/getDropZones', validate(validateGetDropZones), getDropZones);

router.get('/dropZoneDirectories', getDropzoneDirectories);

router.get(
  '/dropZoneDirectoryDetails',
  validate(validateDropZoneDirectoryDetails),
  getDropzoneDirectoryDetails
);

router.post(
  '/dropzoneFileSearch',
  validate(validateDropZoneFileSearch),
  dropzoneFileSearch
);

router.get(
  '/getSuperFileDetails',
  validate(validateGetSuperfileDetails),
  getSuperfileDetails
);

router.get(
  '/clusterMetaData',
  validate(validateClusterMetaData),
  getClusterMetaData
);

module.exports = router;

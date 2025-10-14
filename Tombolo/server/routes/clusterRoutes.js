const express = require('express');
const router = express.Router();

const {
  validateAddClusterInputs,
  validateClusterId,
  validateUpdateClusterInputs,
  validateClusterPingPayload,
  validateQueryData,
} = require('../middlewares/clusterMiddleware');
const { validate } = require('../middlewares/validateRequestBody');

const {
  addCluster,
  addClusterWithProgress,
  getClusters,
  getCluster,
  updateCluster,
  deleteCluster,
  getClusterWhiteList,
  pingCluster,
  pingExistingCluster,
  clusterUsage,
  clusterStorageHistory,
  checkClusterHealth,
} = require('../controllers/clusterController');
const role = require('../config/roleTypes');

const { validateUserRole } = require('../middlewares/rbacMiddleware');

router.get('/', getClusters); // GET - all clusters
router.get('/getOne/:id', validate(validateClusterId), getCluster); // GET - one cluster by id

//cluster dashboards
router.get(
  '/currentClusterUsage/:id',
  validate(validateClusterId),
  clusterUsage
);
router.get(
  '/clusterStorageHistory/:queryData',
  validate(validateQueryData),
  clusterStorageHistory
);

// All routes below is accessible only by users with role "owner" and "administrator"
router.use(validateUserRole([role.OWNER, role.ADMIN]));

router.post('/post', validate(validateClusterPingPayload), pingCluster); // GET - Ping cluster
router.post(
  '/clusterHealth',
  validate(validateClusterPingPayload),
  checkClusterHealth
);

router.get(
  '/pingExistingCluster/:id',
  validate(validateClusterId),
  pingExistingCluster
); // GET - Ping existing cluster
router.get('/whiteList', getClusterWhiteList); // GET - cluster white list
router.post('/', validate(validateAddClusterInputs), addCluster); // CREATE - one cluster
router.post(
  '/addClusterWithProgress',
  validate(validateAddClusterInputs),
  addClusterWithProgress
); // CREATE - one cluster with progress

router.delete('/:id', validate(validateClusterId), deleteCluster); // DELETE - one cluster by id
router.patch('/:id', validate(validateUpdateClusterInputs), updateCluster); // UPDATE - one cluster by id

module.exports = router;

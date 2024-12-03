const express = require("express");
const router = express.Router();

const {
  validateAddClusterInputs,
  validateClusterId,
  validateUpdateClusterInputs,
  validateClusterPingPayload,
  validateQueryData,
} = require("../middlewares/clusterMiddleware");

const {
  addCluster,
  addClusterWithProgress,
  getClusters,
  getCluster,
  deleteCluster,
  updateCluster,
  getClusterWhiteList,
  pingCluster,
  clusterUsage,
  clusterStorageHistory,
} = require("../controllers/clusterController");
const role = require("../config/roleTypes");

const { validateUserRole } = require("../middlewares/rbacMiddleware");

// All routes below is accessible only by users with role "owner" and "administrator"
router.use(validateUserRole([role.OWNER, role.ADMIN]));


router.post("/ping", validateClusterPingPayload, pingCluster); // GET - Ping cluster
router.get("/whiteList", getClusterWhiteList); // GET - cluster white list
router.post("/", validateAddClusterInputs, addCluster); // CREATE - one cluster
router.post(
  "/addClusterWithProgress",
  validateAddClusterInputs,
  addClusterWithProgress
); // CREATE - one cluster with progress
router.get("/", getClusters); // GET - all clusters
router.get("/:id", validateClusterId, getCluster); // GET - one cluster by id
router.delete("/:id", validateClusterId, deleteCluster); // DELETE - one cluster by id
router.patch("/:id", validateUpdateClusterInputs, updateCluster); // UPDATE - one cluster by id

//cluster dashboards
router.get("/currentClusterUsage/:id", validateClusterId, clusterUsage);
router.get(
  "/clusterStorageHistory/:queryData",
  validateQueryData,
  clusterStorageHistory
);

module.exports = router;

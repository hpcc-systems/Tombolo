const express = require("express");
const router = express.Router();

const {
  validateAddClusterInputs,
  validateClusterId,
  validateUpdateClusterInputs,
} = require("../middlewares/clusterMiddleware");
const {
  addCluster,
  getClusters,
  getCluster,
  deleteCluster,
  updateCluster,
  getClusterWhiteList,
} = require("../controllers/clusterController");

router.get("/whiteList", getClusterWhiteList); // GET - cluster white list
router.post("/", validateAddClusterInputs, addCluster); // CREATE - one cluster
router.get("/", getClusters); // GET - all clusters
router.get("/:id", validateClusterId, getCluster); // GET - one cluster by id
router.delete("/:id", validateClusterId, deleteCluster); // DELETE - one cluster by id
router.patch("/:id", validateUpdateClusterInputs, updateCluster); // UPDATE - one cluster by id

module.exports = router;

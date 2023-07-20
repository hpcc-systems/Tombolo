const express = require("express");
const router = express.Router();
var request = require("request");
var requestPromise = require("request-promise");
const hpccUtil = require("../../utils/hpcc-util");
const assetUtil = require("../../utils/assets");
const { encryptString } = require("../../utils/cipher");
const validatorUtil = require("../../utils/validator");
var models = require("../../models");
var Cluster = models.cluster;
var File = models.file;
var Query = models.query;
var Index = models.indexes;
var Job = models.job;
let hpccJSComms = require("@hpcc-js/comms");
const { body, query, validationResult } = require("express-validator");
const ClusterWhitelist = require("../../cluster-whitelist");
let lodash = require("lodash");
const { io } = require("../../server");
const fs = require("fs");
const { response } = require("express");
const userService = require("../user/userservice");
const path = require("path");
var sanitize = require("sanitize-filename");
const logger = require("../../config/logger");
const moment = require("moment");
router.post(
  "/filesearch",
  [
    body("keyword")
      .matches(/^[a-zA-Z0-9_. \-:\*\?]*$/)
      .withMessage("Invalid keyword"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .send({ success: "false", message: "Error occurred during search." });
    }
    hpccUtil
      .getCluster(req.body.clusterid)
      .then(function (cluster) {
        let results = [];
        try {
          let clusterAuth = hpccUtil.getClusterAuth(cluster);
          let contentType = req.body.indexSearch ? "key" : "";
          console.log("contentType: " + contentType);
          let dfuService = new hpccJSComms.DFUService({
            baseUrl: cluster.thor_host + ":" + cluster.thor_port,
            userID: clusterAuth ? clusterAuth.user : "",
            password: clusterAuth ? clusterAuth.password : "",
          });
          const { fileNamePattern } = req.body;
          let logicalFileName;
          if (fileNamePattern === "startsWith") {
            logicalFileName = req.body.keyword + "*";
          } else if (fileNamePattern === "endsWith") {
            logicalFileName = "*" + req.body.keyword;
          } else if (fileNamePattern === "wildCards") {
            logicalFileName = req.body.keyword;
          } else {
            logicalFileName = "*" + req.body.keyword + "*";
          }
          dfuService
            .DFUQuery({
              LogicalName: logicalFileName,
              ContentType: contentType,
            })
            .then((response) => {
              if (
                response.DFULogicalFiles &&
                response.DFULogicalFiles.DFULogicalFile &&
                response.DFULogicalFiles.DFULogicalFile.length > 0
              ) {
                let searchResults = response.DFULogicalFiles.DFULogicalFile;
                searchResults.forEach((logicalFile) => {
                  results.push({
                    text: logicalFile.Name,
                    value: logicalFile.Name,
                  });
                });
                //remove duplicates
                results = results.filter(
                  (elem, index, self) =>
                    self.findIndex((t) => {
                      return t.text === elem.text;
                    }) === index
                );
              }
              res.json(results);
            });
        } catch (err) {
          console.log(err);
          res.status(500).send({
            success: "false",
            message: "Error occured during search.",
          });
        }
      })
      .catch((err) => {
        console.log("------------------------------------------");
        console.log("Cluster not reachable", +JSON.stringify(err));
        console.log("------------------------------------------");
        res.status(500).send({
          success: "false",
          message: "Search failed. Please check if the cluster is running.",
        });
      });
  }
);

router.post(
  "/superfilesearch",
  [
    body("keyword")
      .matches(/^[a-zA-Z0-9_. \-:\*\?]*$/)
      .withMessage("Invalid keyword"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .send({ success: "false", message: "Error occurred during search." });
    }

    hpccUtil
      .getCluster(req.body.clusterid)
      .then(async function (cluster) {
        let results = [];
        try {
          const { fileNamePattern } = req.body;

          let logicalFileName;
          if (fileNamePattern === "startsWith") {
            logicalFileName = req.body.keyword + "*";
          } else if (fileNamePattern === "endsWith") {
            logicalFileName = "*" + req.body.keyword;
          } else if (fileNamePattern === "wildCards") {
            logicalFileName = req.body.keyword;
          } else {
            logicalFileName = "*" + req.body.keyword + "*";
          }

          let superfile = await hpccUtil.getSuperFiles(
            req.body.clusterid,
            logicalFileName
          );

          res.json(superfile);
        } catch (err) {
          console.log(err);
          res.status(500).send({
            success: "false",
            message: "Error occured during search.",
            message: "Search failed. Please check if the cluster is running.",
          });
        }
      })
      .catch((err) => {
        console.log("------------------------------------------");
        console.log("Cluster not reachable", +JSON.stringify(err));
        console.log("------------------------------------------");
        res.status(500).send({
          success: "false",
          message: "Search failed. Please check if the cluster is running.",
        });
      });
  }
);
router.post(
  "/querysearch",
  [
    body("keyword")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid keyworkd"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    hpccUtil
      .getCluster(req.body.clusterid)
      .then(function (cluster) {
        let clusterAuth = hpccUtil.getClusterAuth(cluster);
        let wsWorkunits = new hpccJSComms.WorkunitsService({
            baseUrl: cluster.thor_host + ":" + cluster.thor_port,
            userID: clusterAuth ? clusterAuth.user : "",
            password: clusterAuth ? clusterAuth.password : "",
            type: "get",
          }),
          querySearchAutoComplete = [];
        wsWorkunits
          .WUListQueries({
            QueryName: "*" + req.body.keyword + "*",
            QuerySetName: "roxie",
            Activated: true,
          })
          .then((response) => {
            console.log(response);
            if (response.QuerysetQueries) {
              querySearchResult = response.QuerysetQueries.QuerySetQuery;
              querySearchResult.forEach((querySet, index) => {
                querySearchAutoComplete.push({
                  id: querySet.Id,
                  text: querySet.Name,
                  value: querySet.Name,
                });
              });
              querySearchAutoComplete = querySearchAutoComplete.filter(
                (elem, index, self) =>
                  self.findIndex((t) => {
                    return t.text === elem.text;
                  }) === index
              );
            }
            res.json(querySearchAutoComplete);
          })
          .catch((err) => {
            console.log(
              "Error occured while querying : " + JSON.stringify(err)
            );
            res.status(500).send({
              success: "false",
              message: "Search failed. Error occured while querying.",
            });
          });
      })
      .catch((err) => {
        console.log("Cluster not reachable: " + JSON.stringify(err));
        res.status(500).send({
          success: "false",
          message: "Search failed. Please check if the cluster is running.",
        });
      });
  }
);
router.post(
  "/jobsearch",
  [
    // body("keyword")
    //   .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/)
    //   .withMessage("Invalid keyword"),
    // body("clusterId").isUUID(4).withMessage("Invalid cluster id"),
    // body("clusterType")
    //   .optional({ checkFalsy: true })
    //   .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/)
    //   .withMessage("Invalid cluster type"),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });
    try {
      const { keyword, clusterId, clusterType } = req.body;
      const wuService = await hpccUtil.getWorkunitsService(clusterId);
        console.log("------ key word ----------------------------");
        console.dir(keyword);
        console.log("------------------------------------------");

      //If no * add to start and end
      // If there are one or more astrik leave as they are
      let jobName = keyword.includes("*") ? keyword : `*${keyword}*`;
      console.log('------ job name----------------------------');
      console.dir(jobName)
      console.log('------------------------------------------');
      const response = await wuService.WUQuery({
        Jobname: jobName ,
        Cluster: clusterType,
      });

      let workunitsResult = [];

      if (response.Workunits) {
        const workunitsHash = response.Workunits.ECLWorkunit.reduce(
          (acc, wu) => {
            //dont add any duplicates
            if (!acc[wu.Jobname])
              acc[wu.Jobname] = {
                text: wu.Jobname,
                value: wu.Wuid,
                cluster: wu.Cluster,
                ExecuteCost: wu.CompileCost,
                FileAccessCost: wu.FileAccessCost,
                CompileCost: wu.CompileCost
              };
            return acc;
          },
          {}
        );
        workunitsResult = Object.values(workunitsHash);
      }
            console.log("---- response ----------------------------");
            console.dir(workunitsResult);
            console.log("------------------------------------------");
      return res.status(200).send(workunitsResult);
    } catch (error) {
      logger.error("jobsearch error", error);
      res.status(500).send({
        success: "false",
        message: "Search failed. Please check if the cluster is running.",
      });
    }
  }
);
router.get("/getClusters", async (req, res) => {
  try {
    const clusters = await Cluster.findAll({
      attributes: { exclude: ["hash", "username"] },
      order: [["createdAt", "DESC"]],
    });
    res.send(clusters);
  } catch (err) {
    logger.error(err);
    res.status(500).send({
      success: "false",
      message: "Error occurred while retrieving cluster list",
    });
  }
});
router.get("/getClusterWhitelist", function (req, res) {
  try {
    res.json(ClusterWhitelist.clusters);
  } catch (err) {
    console.log("err", err);
  }
});
router.get("/getCluster", function (req, res) {
  console.log("in /getCluster");
  try {
    Cluster.findOne({ where: { id: req.query.cluster_id } })
      .then(function (clusters) {
        res.json(clusters);
      })
      .catch(function (err) {
        console.log(err);
      });
  } catch (err) {
    console.log("err", err);
  }
});
router.post(
  "/newcluster",
  [
    body("name")
      .matches(/^[a-zA-Z0-9_:\s\-]*$/)
      .withMessage("Invalid name"),
    body("id")
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage("Invalid id"),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      let cluster = ClusterWhitelist.clusters.filter(
        (cluster) => cluster.name == req.body.name
      );
      if (cluster && cluster.length > 0) {
        const thorReachable = await hpccUtil.isClusterReachable(
          cluster[0].thor,
          cluster[0].thor_port,
          req.body.username,
          req.body.password
        );
        // const roxieReachable = await hpccUtil.isClusterReachable(cluster[0].roxie, cluster[0].roxie_port, req.body.username, req.body.password);
        if (thorReachable.reached) {
          var newCluster = {
            name: req.body.name,
            thor_host: cluster[0].thor,
            thor_port: cluster[0].thor_port,
            roxie_host: cluster[0].roxie,
            roxie_port: cluster[0].roxie_port,
          };
          if (req.body.username && req.body.password) {
            newCluster.username = req.body.username;
            newCluster.hash = encryptString(req.body.password);
          }
          if (req.body.id == undefined || req.body.id == "") {
            const result = await Cluster.create(newCluster);
            //get clusterTimezoneOFfset once ID is available after cluster creation
            const offset = await hpccUtil.getClusterTimezoneOffset(
              result.dataValues.id
            );
            //if succesful, set timezone offset and update
            if (offset || offset == 0) {
              newCluster.timezone_offset = offset;
              await Cluster.update(newCluster, {
                where: { id: result.dataValues.id },
              });
              res.status(200).json({
                success: true,
                message: "Successfully added new cluster",
              });
            } else {
              res.status(400).json({
                success: false,
                message:
                  "Failure to add Cluster, Timezone Offset could not be found",
              });
            }
          } else {
            //get clusterTimezoneOFfset once ID is available after cluster creation
            const offset = await hpccUtil.getClusterTimezoneOffset(req.body.id);
            if (offset) {
              newCluster.timezone_offset = offset;
              await Cluster.update(newCluster, { where: { id: req.body.id } });
              res.status(200).json({
                success: true,
                message: "Successfully updated cluster",
              });
            } else {
              res.status(400).json({
                success: false,
                message:
                  "Failure to add Cluster, Timezone Offset could not be found",
              });
            }
          }
        } else {
          return res
            .status(400)
            .json({ success: false, message: "Cluster could not be reached" });
        }
      }
    } catch (err) {
      logger.error("err", err);
      return res.status(500).send({
        success: "false",
        message: "Error occurred while adding new Cluster",
      });
    }
  }
);
router.post("/removecluster", function (req, res) {
  console.log(req.body.clusterIdsToDelete);
  try {
    Cluster.destroy(
      { where: { id: req.body.clusterIdsToDelete } },
      function (err) {}
    );
    return res.status(200).send({ result: "success" });
  } catch (err) {
    console.log("err", err);
  }
});
router.get(
  "/getFileInfo",
  [
    query("fileName").exists().withMessage("Invalid file name"),
    query("clusterid")
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage("Invalid cluster id"),
    query("applicationId").isUUID(4).withMessage("Invalid application id"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { applicationId, fileName, clusterid } = req.query;
      const file = await File.findOne({
        where: { name: fileName, application_id: applicationId },
        attributes: ["id"],
      });
      const data = file
        ? await assetUtil.fileInfo(applicationId, file.id)
        : await hpccUtil.fileInfo(fileName, clusterid);
      res.status(200).json(data);
    } catch (error) {
      console.log("error", error);
      return res.status(500).send("Error occurred while getting file details");
    }
  }
);
// Gets file detail straight from HPCC  regardless of whether it exists in Tombolo DB
router.get(
  "/getLogicalFileDetails",
  [
    query("fileName").exists().withMessage("Invalid file name"),
    query("clusterid")
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage("Invalid cluster id"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });
      const { fileName, clusterid } = req.query;
      const details = await hpccUtil.logicalFileDetails(fileName, clusterid);
      // Removing unnecessary data before sending to client
      details.DFUFilePartsOnClusters
        ? delete details.DFUFilePartsOnClusters
        : null;
      details.Ecl ? delete details.Ecl : null;
      details.Stat ? delete details.Stat : null;
      res.status(200).json(details);
    } catch (error) {
      console.log("error", error);
      return res.status(500).send("Error occurred while getting file details");
    }
  }
);
router.get(
  "/getIndexInfo",
  [
    query("indexName")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid index name"),
    query("clusterid").isUUID(4).withMessage("Invalid cluster id"),
    query("applicationId").isUUID(4).withMessage("Invalid application id"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      Index.findOne({
        where: {
          name: req.query.indexName,
          application_id: req.query.applicationId,
        },
      }).then((existingIndex) => {
        if (existingIndex) {
          assetUtil
            .indexInfo(req.query.applicationId, existingIndex.id)
            .then((existingIndexInfo) => {
              res.json(existingIndexInfo);
            });
        } else {
          hpccUtil
            .indexInfo(req.query.clusterid, req.query.indexName)
            .then((indexInfo) => {
              res.json(indexInfo);
            })
            .catch((err) => {
              console.log("err", err);
              return res
                .status(500)
                .send("Error occured while getting file details");
            });
        }
      });
    } catch (err) {
      console.log("err", err);
      return res.status(500).send("Error occured while getting file details");
    }
  }
);
function getIndexColumns(cluster, indexName) {
  let columns = {};
  return requestPromise
    .get({
      url:
        cluster.thor_host +
        ":" +
        cluster.thor_port +
        "/WsDfu/DFUGetFileMetaData.json?LogicalFileName=" +
        indexName,
      auth: hpccUtil.getClusterAuth(cluster),
    })
    .then(function (response) {
      var result = JSON.parse(response);
      if (result.DFUGetFileMetaDataResponse != undefined) {
        var indexColumns =
            result.DFUGetFileMetaDataResponse.DataColumns.DFUDataColumn,
          nonkeyedColumns = [],
          keyedColumns = [];
        if (indexColumns != undefined) {
          indexColumns.forEach(function (column) {
            if (column.IsKeyedColumn) {
              keyedColumns.push({
                id: column.ColumnID,
                name: column.ColumnLabel,
                type: column.ColumnType,
                eclType: column.ColumnEclType,
              });
            } else if (!column.IsKeyedColumn) {
              nonkeyedColumns.push({
                id: column.ColumnID,
                name: column.ColumnLabel,
                type: column.ColumnType,
                eclType: column.ColumnEclType,
              });
            }
          });
          columns.nonKeyedColumns = nonkeyedColumns;
          columns.keyedColumns = keyedColumns;
        }
      }
      return columns;
    })
    .catch(function (err) {
      console.log("error occured: " + err);
    });
}
router.get(
  "/getData",
  [
    query("clusterid").isUUID(4).withMessage("Invalid cluster id"),
    query("fileName")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid file name"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      hpccUtil.getCluster(req.query.clusterid).then(function (cluster) {
        let clusterAuth = hpccUtil.getClusterAuth(cluster);
        let wuService = new hpccJSComms.WorkunitsService({
          baseUrl: cluster.thor_host + ":" + cluster.thor_port,
          userID: clusterAuth ? clusterAuth.user : "",
          password: clusterAuth ? clusterAuth.password : "",
        });
        wuService
          .WUResult({
            LogicalName: req.query.fileName,
            Cluster: "mythor",
            Count: 50,
          })
          .then((response) => {
            if (
              response.Result != undefined &&
              response.Result != undefined &&
              response.Result.Row != undefined
            ) {
              var rows = response.Result.Row,
                indexInfo = {};
              if (rows.length > 0) {
                rows.shift();
                res.json(rows);
              } else {
                res.json([]);
              }
            } else {
              res.json([]);
            }
          })
          .catch((err) => {
            console.log("err", err);
            return res
              .status(500)
              .send("Error occured while getting file data");
          });
      });
    } catch (err) {
      console.log("err", err);
      return res.status(500).send("Error occured while getting file data");
    }
  }
);
router.get("/getFileProfile", function (req, res) {
  try {
    hpccUtil.getCluster(req.query.clusterid).then(function (cluster) {
      request.get(
        {
          url:
            cluster.thor_host +
            ":" +
            cluster.thor_port +
            "/WsWorkunits/WUResult.json?LogicalName=" +
            req.query.fileName +
            ".profile",
          auth: hpccUtil.getClusterAuth(cluster),
        },
        function (err, response, body) {
          if (err) {
            console.log("ERROR - ", err);
            return response.status(500).send("Error");
          } else {
            var result = JSON.parse(body);
            if (result.Exceptions) {
              res.json([]);
            }
            if (
              result.WUResultResponse != undefined &&
              result.WUResultResponse.Result != undefined &&
              result.WUResultResponse.Result.Row != undefined
            ) {
              var rows = result.WUResultResponse.Result.Row,
                indexInfo = {};
              if (rows.length > 0) {
                rows.forEach(function (row, index) {
                  Object.keys(row).forEach(function (key) {
                    if (row[key] instanceof Object) {
                      if (row[key].Row) {
                        row[key] = row[key].Row;
                      }
                    }
                  });
                });
                res.json(rows);
              }
            } else {
              res.json();
            }
          }
        }
      );
    });
  } catch (err) {
    console.log("err", err);
  }
});
router.get("/getFileProfileHTML", function (req, res) {
  try {
    hpccUtil.getCluster(req.query.clusterid).then(function (cluster) {
      //call DFUInfo to get workunit id
      var wuid = req.query.dataProfileWuid;
      //get resource url's from wuinfo
      request.post(
        {
          url:
            cluster.thor_host +
            ":" +
            cluster.thor_port +
            "/WsWorkunits/WUInfo.json",
          auth: hpccUtil.getClusterAuth(cluster),
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body:
            "Wuid=" +
            wuid +
            "&TruncateEclTo64k=true&IncludeResourceURLs=true&IncludeExceptions=false&IncludeGraphs=false&IncludeSourceFiles=false&IncludeResults=false&IncludeResultsViewNames=false&IncludeVariables=false&IncludeTimers=false&IncludeDebugValues=false&IncludeApplicationValues=false&IncludeWorkflows=false&IncludeXmlSchemas=false&SuppressResultSchemas",
        },
        function (err, response, body) {
          if (err) {
            console.log("ERROR - ", err);
            return response.status(500).send("Error");
          } else {
            var result = JSON.parse(body);
            var filterdUrl =
              result.WUInfoResponse.Workunit.ResourceURLs.URL.filter(function (
                url
              ) {
                return !url.startsWith("manifest");
              }).map(function (url) {
                return (
                  cluster.thor_host +
                  ":" +
                  cluster.thor_port +
                  "/WsWorkunits/" +
                  url.replace("./report", "report")
                );
              });
            console.log("URL's: " + JSON.stringify(filterdUrl));
            res.json(filterdUrl);
          }
        }
      );
    });
  } catch (err) {
    console.log("err", err);
  }
});
router.get(
  "/getQueryInfo",
  [
    query("clusterid").isUUID(4).withMessage("Invalid cluster id"),
    query("queryName")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid query name"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    Query.findOne({
      where: {
        name: req.query.queryName,
        application_id: req.query.applicationId,
      },
    }).then((existingQuery) => {
      if (existingQuery) {
        assetUtil
          .queryInfo(req.query.applicationId, existingQuery.id)
          .then((existingQueryInfo) => {
            res.json(existingQueryInfo);
          });
      } else {
        hpccUtil
          .queryInfo(req.query.clusterid, req.query.queryName)
          .then((queryInfo) => {
            res.json(queryInfo);
          })
          .catch((err) => {
            console.log("err", err);
            return res
              .status(500)
              .send("Error occured while getting file details");
          });
      }
    });
  }
);
router.get(
  "/getQueryFiles",
  [
    query("hpcc_queryId")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid hpcc query id"),
    query("clusterId").isUUID(4).withMessage("Invalid cluster id"),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const wuService = await hpccUtil.getWorkunitsService(req.query.clusterId);
      const response = await wuService.WUQueryDetails({
        QueryId: req.query.hpcc_queryId,
        IncludeSuperFiles: true,
        QuerySet: "roxie",
      });
      res.status(200).json({
        success: true,
        logicalFiles: response?.LogicalFiles?.Item || [],
        superFiles: response?.SuperFiles?.SuperFile || [],
      });
    } catch (err) {
      logger.error(err);
      res
        .status(503)
        .json({ success: false, message: "Error while fetching query files" });
    }
  }
);
router.get(
  "/getJobInfo",
  [
    query("clusterid").isUUID(4).withMessage("Invalid cluster id"),
    query("jobWuid")
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage("Invalid workunit id"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      Job.findOne({
        where: {
          name: req.query.jobName,
          cluster_id: req.query.clusterid,
          application_id: req.query.applicationId,
        },
        attributes: ["id"],
      }).then((existingJob) => {
        if (existingJob) {
          assetUtil
            .jobInfo(req.query.applicationId, existingJob.id)
            .then((existingJobInfo) => {
              res.json(existingJobInfo);
            });
        } else {
          hpccUtil
            .getJobInfo(
              req.query.clusterid,
              req.query.jobWuid,
              req.query.jobType
            )
            .then((jobInfo) => {
              res.json(jobInfo);
            })
            .catch((err) => {
              console.log("err", err);
              return res
                .status(500)
                .send("Error occured while getting file details");
            });
        }
      });
    } catch (err) {
      console.log("err", err);
    }
  }
);
router.get(
  "/getDropZones",
  [query("clusterId").isUUID(4).withMessage("Invalid cluster id")],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      hpccUtil
        .getCluster(req.query.clusterId)
        .then(function (cluster) {
          let url =
            cluster.thor_host +
            ":" +
            cluster.thor_port +
            "/WsTopology/TpDropZoneQuery.json";
          request.get(
            {
              url: url,
              auth: hpccUtil.getClusterAuth(cluster),
            },
            function (err, response, body) {
              if (err) {
                console.log("ERROR - ", err);
                return response.status(500).send("Error");
              } else {
                let result = JSON.parse(body);
                let dropZones =
                  result.TpDropZoneQueryResponse.TpDropZones.TpDropZone;
                let _dropZones = {};
                let dropZoneDetails = [];
                dropZones.map((dropzone) => {
                  dropZoneDetails.push({
                    name: dropzone.Name,
                    path: dropzone.Path,
                    machines: dropzone.TpMachines.TpMachine,
                  });
                  _dropZones[dropzone.Name] = [];
                  lodash.flatMap(dropzone.TpMachines.TpMachine, (tpMachine) => {
                    _dropZones[dropzone.Name] = _dropZones[
                      dropzone.Name
                    ].concat([tpMachine.Netaddress]);
                  });
                });
                if (
                  req.query.for === "fileUpload" ||
                  req.query.for === "manualJobSerach" ||
                  req.query.for === "lzFileExplorer"
                ) {
                  res.json(dropZoneDetails);
                } else {
                  res.json(_dropZones);
                }
              }
            }
          );
        })
        .catch((err) => {
          res.status(500).json({ success: false, message: err });
        });
    } catch (err) {
      console.log("err", err);
      return res.status(500).send("Error occured while getting dropzones");
    }
  }
);
router.get("/dropZoneDirectories", async (req, res) => {
  try {
    const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;
    const directories = await hpccUtil.getDirectories({
      clusterId,
      Netaddr,
      Path,
      DirectoryOnly,
    });
    res.status(200).send(directories);
  } catch (error) {
    logger.error("Failed to find directories", error);
    res.status(500).send({ message: error.message });
  }
});

router.get('/getDropZones', [
	query('clusterId')
    .isUUID(4).withMessage('Invalid cluster id'),
  ],  function (req, res) {
	  const errors = validationResult(req).formatWith(validatorUtil.errorFormatter);
	if (!errors.isEmpty()) {
	  return res.status(422).json({ success: false, errors: errors.array() });
	}
	try {
		 hpccUtil.getCluster(req.query.clusterId).then(function(cluster) {
			let url = cluster.thor_host + ':' + cluster.thor_port +'/WsTopology/TpDropZoneQuery.json';
			request.get({
				url: url,
				auth : hpccUtil.getClusterAuth(cluster)
			}, function(err, response, body) {
			if (err) {
				console.log('ERROR - ', err);
				return response.status(500).send('Error');
			}
			else {
				let result = JSON.parse(body);
				let dropZones = result.TpDropZoneQueryResponse.TpDropZones.TpDropZone;
				let _dropZones = {};
				let dropZoneDetails = []
				dropZones.map(dropzone => {
					dropZoneDetails.push({name : dropzone.Name, path: dropzone.Path, machines : dropzone.TpMachines.TpMachine})
					_dropZones[dropzone.Name] = [];
					lodash.flatMap(dropzone.TpMachines.TpMachine, (tpMachine) => {
						_dropZones[dropzone.Name] = _dropZones[dropzone.Name].concat([tpMachine.Netaddress]);
					})
				});

				if(req.query.for === "fileUpload" || req.query.for === "manualJobSerach" || req.query.for === "lzFileExplorer"){
					res.json(dropZoneDetails)
				}else{
					res.json(_dropZones);
				}
			}
			})
		}).catch(err =>{
			res.status(500).json({success: false, message : err});
		})
	} catch (err) {
		console.log('err', err);
		return res.status(500).send("Error occured while getting dropzones");
	}
})

router.get(
  "/dropZoneDirectoryDetails",
  [
    query("clusterId").exists().withMessage("Invalid cluster ID"),
    query("Netaddr").exists().withMessage("Invalid Netaddr"),
    query("DirectoryOnly")
      .exists()
      .withMessage(
        "Invalid directory only value. It should be either true or false"
      ),
    query("Path").exists().withMessage("Invalid path"),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;
    console.log("Cluster id etc", clusterId, Netaddr, Path, DirectoryOnly);
    try {
      const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;

      const directories = await hpccUtil.getDirectories({
        clusterId,
        Netaddr,
        Path,
        DirectoryOnly,
      });
      let fileCount = 0;
      let directoryCount = 0;
      let oldestFile = null;
      const allAssets = [];
      if (response.FileListResponse?.files) {
        const { PhysicalFileStruct: assets } = response.FileListResponse.files;
        for (let asset of assets) {
          asset.age = moment(asset.modifiedtime).fromNow(true);
          if (asset.isDir) {
            directoryCount++;
            allAssets.unshift(asset);
          } else {
            fileCount++;
            allAssets.push(asset);
            if (!oldestFile) {
              oldestFile = asset;
            } else {
              let currentOldestFileModifiedTime = moment(
                oldestFile.modifiedtime
              );
              const currentFileModifiedTime = moment(asset.modifiedtime);
              const diff = currentOldestFileModifiedTime.diff(
                currentFileModifiedTime,
                "seconds"
              );
              if (diff > 0) oldestFile = asset;
            }
          }
        }
        console.log(assets);
      }
      const directoryDetails = {
        fileCount,
        directoryCount,
        oldestFile,
        filesAndDirectories: allAssets,
      };
      res.status(200).json(directoryDetails);
    } catch (err) {
      console.log(err);
      res.status(503).json({ success: false, message: err.message });
    }
  }
);
router.post(
  "/dropZoneFileSearch",
  [
    body("clusterId").isUUID(4).withMessage("Invalid cluster id"),
    body("dropZoneName")
      .matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]*$/)
      .withMessage("Invalid dropzone name"),
    body("server")
      .matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]/)
      .withMessage("Invalid server"),
    body("nameFilter")
      .matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]*$/)
      .withMessage("Invalid file filter"),
  ],
  function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      hpccUtil.getCluster(req.body.clusterId).then(function (cluster) {
        request.post(
          {
            url:
              cluster.thor_host +
              ":" +
              cluster.thor_port +
              "/FileSpray/DropZoneFileSearch.json",
            auth: hpccUtil.getClusterAuth(cluster),
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body:
              "DropZoneName=" +
              req.body.dropZoneName +
              "&Server=" +
              req.body.server +
              "&NameFilter=*" +
              req.body.nameFilter +
              "*&__dropZoneMachine.label=" +
              req.body.server +
              "&__dropZoneMachine.value=" +
              req.body.server +
              "&__dropZoneMachine.selected=true&rawxml_=true",
          },
          function (err, response, body) {
            if (err) {
              console.log("ERROR - ", err);
              return response
                .status(500)
                .send("Error occured during dropzone file search");
            } else {
              var result = JSON.parse(body);
              let files = [];
              if (
                result &&
                result.DropZoneFileSearchResponse &&
                result.DropZoneFileSearchResponse["Files"] &&
                result.DropZoneFileSearchResponse["Files"]["PhysicalFileStruct"]
              ) {
                files =
                  result.DropZoneFileSearchResponse["Files"][
                    "PhysicalFileStruct"
                  ];
              }
              return res.status(200).send(files);
            }
          }
        );
      });
    } catch (err) {
      console.log("err", err);
      return response
        .status(500)
        .send("Error occured during dropzone file search");
    }
  }
);

router.get(
  "/getSuperFileDetails",
  [
    query("fileName").exists().withMessage("Invalid file name"),
    query("clusterid")
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage("Invalid cluster id"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, errors: errors.array() });

      const { fileName, clusterid } = req.query;

      const details = await hpccUtil.getSuperFile(clusterid, fileName);

      res.status(200).json(details);
    } catch (error) {
      console.log("error", error);
      return res.status(500).send("Error occurred while getting file details");
    }
  }
);

router.post(
  "/executeSprayJob",
  [body("jobId").isUUID(4).withMessage("Invalid cluster id")],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      let job = await Job.findOne({
        where: { id: req.body.jobId },
        attributes: { exclude: ["assetId"] },
      });
      let cluster = hpccUtil
        .getCluster(job.cluster_id)
        .then(async function (cluster) {
          let sprayPayload = {
            destGroup: "mythor",
            DFUServerQueue: "dfuserver_queue",
            namePrefix: job.sprayedFileScope,
            targetName: job.sprayFileName,
            overwrite: "on",
            sourceIP: job.sprayDropZone,
            sourcePath: "/var/lib/HPCCSystems/mydropzone/" + job.sprayFileName,
            destLogicalName: job.sprayedFileScope + "::" + job.sprayFileName,
            rawxml_: 1,
            sourceFormat: 1,
            sourceCsvSeparate: ",",
            sourceCsvTerminate: "\n,\r\n",
            sourceCsvQuote: '"',
          };
          console.log(sprayPayload);
          request.post(
            {
              url:
                cluster.thor_host +
                ":" +
                cluster.thor_port +
                "/FileSpray/SprayVariable.json",
              auth: hpccUtil.getClusterAuth(cluster),
              headers: { "content-type": "application/x-www-form-urlencoded" },
              formData: sprayPayload,
              resolveWithFullResponse: true,
            },
            function (err, response, body) {
              if (err) {
                console.log("ERROR - ", err);
                return response
                  .status(500)
                  .send("Error occured during dropzone file search");
              } else {
                var result = JSON.parse(body);
                return res.status(200).send(result);
              }
            }
          );
        });
    } catch (err) {
      console.log("err", err);
      return response
        .status(500)
        .send("Error occured during dropzone file search");
    }
  }
);
// Drop Zone file upload namespace
io.of("/landingZoneFileUpload").on("connection", (socket) => {
  if (socket.handshake.auth) {
    userService
      .verifyToken(socket.handshake.auth.token)
      .then((response) => {
        return response;
      })
      .catch((err) => {
        socket.emit("error", err);
        socket.disconnect();
      });
  }
  let cluster, destinationFolder, machine;
  //Receive cluster and destination folder info when client clicks upload
  socket.on("start-upload", (message) => {
    cluster = message.cluster;
    destinationFolder = message.pathToAsset;
    machine = message.machine;
  });
  //Upload File
  const upload = async (cluster, destinationFolder, id, fileName) => {
    //Check file ext
    const acceptableFileTypes = ["xls", "xlsm", "xlsx", "txt", "json", "csv"];
    const sanitizedFileName = sanitize(fileName);
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "tempFiles",
      sanitizedFileName
    );
    let fileExtension = fileName
      .substr(fileName.lastIndexOf(".") + 1)
      .toLowerCase();
    if (!acceptableFileTypes.includes(fileExtension)) {
      socket.emit("file-upload-response", {
        id,
        fileName,
        success: false,
        message:
          "Invalid file type, Acceptable filetypes are xls, xlsm, xlsx, txt, json and csv",
      });
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(`Failed to remove ${sanitizedFileName} from FS - `, err);
        }
      });
      return;
    }
    try {
      const selectedCluster = await hpccUtil.getCluster(cluster.id);
      //codeql fix 1
      let url = `${cluster.thor_host}:${cluster.thor_port}/FileSpray/UploadFile.json?upload_&rawxml_=1&NetAddress=${machine}&OS=2&Path=${destinationFolder}`;
      request(
        {
          url: url,
          method: "POST",
          auth: hpccUtil.getClusterAuth(selectedCluster),
          formData: {
            "UploadedFiles[]": {
              value: fs.createReadStream(filePath),
              options: {
                filename: fileName,
              },
            },
          },
        },
        function (err, httpResponse, body) {
          const response = JSON.parse(body);
          if (err) {
            return console.log(err);
          }
          if (response.Exceptions) {
            socket.emit("file-upload-response", {
              id,
              fileName,
              success: false,
              message: response.Exceptions.Exception[0].Message,
            });
          } else {
            socket.emit("file-upload-response", {
              id,
              fileName,
              success: true,
              message:
                response.UploadFilesResponse.UploadFileResults
                  .DFUActionResult[0].Result,
            });
          }
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(
                `Failed to remove ${sanitizedFileName} from FS - `,
                err
              );
            }
          });
        }
      );
    } catch (err) {
      console.log(err);
    }
  };
  //When whole file is supplied by the client
  socket.on("upload-file", (message) => {
    let { id, fileName, data } = message;
    const sanitizedFileName = sanitize(fileName);
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "tempFiles",
      sanitizedFileName
    );
    fs.writeFile(filePath, data, function (err) {
      if (err) {
        console.log(
          `Error occured while saving ${sanitizedFileName} in FS`,
          err
        );
        socket.emit("file-upload-response", {
          fileName,
          id,
          success: false,
          message: "Unknown error occured during upload",
        });
      } else {
        upload(cluster, destinationFolder, id, sanitizedFileName);
      }
    });
  });
  //Ask for more
  const supplySlice = (file) => {
    if (file.fileSize - file.received <= 0) {
      let fileData = file.data.join("");
      let fileBuffer = Buffer.from(fileData);
      const fileName = sanitize(file.fileName);
      const filePath = path.join(__dirname, "..", "..", "tempFiles", fileName);
      fs.writeFile(filePath, fileBuffer, function (err) {
        if (err) {
          console.log("Error writing file to the FS", error);
          socket.emit("file-upload-response", {
            fileName,
            success: false,
            message: err,
          });
        } else {
          upload(cluster, destinationFolder, file.id, fileName);
        }
      });
    } else if (file.fileSize - file.received >= 100000) {
      socket.emit("supply-slice", {
        id: file.id,
        chunkStart: file.received,
        chunkSize: 100000,
      });
    } else if (file.fileSize - file.received < 100000) {
      socket.emit("supply-slice", {
        id: file.id,
        chunkStart: file.received,
        chunkSize: file.fileSize - file.received,
      });
    }
  };
  //when a slice of file is supplied by the client
  let files = [{}];
  socket.on("upload-slice", (message) => {
    let { id, fileName, data, fileSize, chunkSize } = message;
    let indexOfCurrentItem = files.findIndex((item) => item.id === id);
    if (indexOfCurrentItem < 0) {
      files.push({ id, fileName, data: [data], fileSize, received: chunkSize });
      let i = files.findIndex((item) => item.id === id);
      supplySlice(files[i]);
    } else {
      let i = files.findIndex((item) => item.id === id);
      files[i].data.push(data);
      files[i].received = files[i].received + chunkSize;
      supplySlice(files[i]);
    }
  });
});
router.get(
  "/clusterMetaData",
  [query("clusterId").isUUID(4).withMessage("Invalid cluster Id")],
  async (req, res) => {
    try {
      const { clusterId } = req.query;
      //Validate cluster Id
      const errors = validationResult(req).formatWith(
        validatorUtil.errorFormatter
      );
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }
      //If cluster id is valid ->      const { clusterId } = req.query;
      //Get cluster details
      let cluster = await hpccUtil.getCluster(clusterId);
      const { thor_host, thor_port, username, hash } = cluster;
      const clusterDetails = {
        baseUrl: `${thor_host}:${thor_port}`,
        userID: username || "",
        password: hash || "",
      };
      const topologyService = new hpccJSComms.TopologyService(clusterDetails);
      const tpServiceQuery = await topologyService.TpServiceQuery({
        Type: "ALLSERVICES",
      });
      const tpLogicalClusterQuery =
        await topologyService.TpLogicalClusterQuery(); // Active execution engines
      const dropZones = tpServiceQuery.ServiceList?.TpDropZones?.TpDropZone; // Landing zones and their local dir paths
      const clusterMetaData = {
        TpDfuServer: tpServiceQuery.ServiceList,
        tpLogicalCluster:
          tpLogicalClusterQuery.TpLogicalClusters.TpLogicalCluster,
        dropZones,
      };
      res.status(200).send(clusterMetaData);
    } catch (err) {
      logger.error(err);
      res.status(503).json({ success: false, message: err });
    }
  }
);
module.exports = router;

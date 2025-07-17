const express = require('express');
const router = express.Router();
const axios = require('axios');
const hpccUtil = require('../../utils/hpcc-util');
const assetUtil = require('../../utils/assets');
const { encryptString } = require('../../utils/cipher');
const validatorUtil = require('../../utils/validator');
const {
  cluster: Cluster,
  file: File,
  query: Query,
  indexes: Index,
  job: Job,
} = require('../../models');
let hpccJSComms = require('@hpcc-js/comms');
const { body, query, validationResult } = require('express-validator');

let lodash = require('lodash');
const fs = require('fs');
const path = require('path');

const logger = require('../../config/logger');
const moment = require('moment');
const { getClusterOptions } = require('../../utils/getClusterOptions');

// const userService = require('../user/userservice');
// var sanitize = require('sanitize-filename');
// const { io } = require('../../server');

let ClusterWhitelist = { clusters: [] };

// check that cluster whitelist exists
if (!fs.existsSync(path.join(__dirname, '../../cluster-whitelist.js'))) {
  //log that cluster whitelist not found
  logger.error('Cluster whitelist not found, please create one');
} else {
  ClusterWhitelist = require('../../cluster-whitelist');
}

router.post(
  '/filesearch',
  [
    body('keyword')
      .matches(/^[a-zA-Z0-9_. \-:\*\?]*$/)
      .withMessage('Invalid keyword'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .send({ success: 'false', message: 'Error occurred during search.' });
    }

    let cluster;
    try {
      cluster = await hpccUtil.getCluster(req.body.clusterid);
    } catch (err) {
      logger.error('------------------------------------------');
      logger.error('Cluster not reachable', +JSON.stringify(err));
      logger.error('------------------------------------------');
      return res.status(500).send({
        success: 'false',
        message: 'Search failed. Please check if the cluster is running.',
      });
    }

    try {
      let results = [];

      let clusterAuth = hpccUtil.getClusterAuth(cluster);
      let contentType = req.body.indexSearch ? 'key' : '';
      let dfuService = new hpccJSComms.DFUService(
        getClusterOptions(
          {
            baseUrl: cluster.thor_host + ':' + cluster.thor_port,
            userID: clusterAuth ? clusterAuth.user : '',
            password: clusterAuth ? clusterAuth.password : '',
          },
          cluster.allowSelfSigned
        )
      );
      const { fileNamePattern } = req.body;
      let logicalFileName;
      if (fileNamePattern === 'startsWith') {
        logicalFileName = req.body.keyword + '*';
      } else if (fileNamePattern === 'endsWith') {
        logicalFileName = '*' + req.body.keyword;
      } else if (fileNamePattern === 'wildCards') {
        logicalFileName = req.body.keyword;
      } else {
        logicalFileName = '*' + req.body.keyword + '*';
      }

      const response = await dfuService.DFUQuery({
        LogicalName: logicalFileName,
        ContentType: contentType,
      });

      if (
        response.DFULogicalFiles &&
        response.DFULogicalFiles.DFULogicalFile &&
        response.DFULogicalFiles.DFULogicalFile.length > 0
      ) {
        let searchResults = response.DFULogicalFiles.DFULogicalFile;
        searchResults.forEach(logicalFile => {
          results.push({
            text: logicalFile.Name,
            value: logicalFile.Name,
          });
        });
        //remove duplicates
        results = results.filter(
          (elem, index, self) =>
            self.findIndex(t => {
              return t.text === elem.text;
            }) === index
        );
      }

      return res.status(200).json(results);
    } catch (err) {
      logger.error(err);
      return res.status(500).send({
        success: 'false',
        message: 'Error occured during search.',
      });
    }
  }
);

router.post(
  '/superfilesearch',
  [
    body('keyword')
      .matches(/^[a-zA-Z0-9_. \-:\*\?]*$/)
      .withMessage('Invalid keyword'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .send({ success: 'false', message: 'Error occurred during search.' });
    }

    try {
      await hpccUtil.getCluster(req.body.clusterid);
    } catch (err) {
      logger.error('------------------------------------------');
      logger.error('Cluster not reachable', +JSON.stringify(err));
      logger.error('------------------------------------------');
      return res.status(500).send({
        success: 'false',
        message: 'Search failed. Please check if the cluster is running.',
      });
    }

    try {
      const { fileNamePattern } = req.body;

      let logicalFileName;
      if (fileNamePattern === 'startsWith') {
        logicalFileName = req.body.keyword + '*';
      } else if (fileNamePattern === 'endsWith') {
        logicalFileName = '*' + req.body.keyword;
      } else if (fileNamePattern === 'wildCards') {
        logicalFileName = req.body.keyword;
      } else {
        logicalFileName = '*' + req.body.keyword + '*';
      }

      let superfile = await hpccUtil.getSuperFiles(
        req.body.clusterid,
        logicalFileName
      );

      return res.status(200).json(superfile);
    } catch (err) {
      logger.error(err);
      return res.status(500).send({
        success: 'false',
        message: 'Error occured during search.',
        message: 'Search failed. Please check if the cluster is running.',
      });
    }
  }
);
router.post(
  '/querysearch',
  [
    body('keyword')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid keyworkd'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    let cluster;
    try {
      cluster = await hpccUtil.getCluster(req.body.clusterid);
    } catch (err) {
      logger.error('Cluster not reachable: ' + JSON.stringify(err));
      return res.status(500).send({
        success: 'false',
        message: 'Search failed. Please check if the cluster is running.',
      });
    }

    try {
      let querySearchAutoComplete = [];
      let clusterAuth = hpccUtil.getClusterAuth(cluster);
      let wsWorkunits = new hpccJSComms.WorkunitsService(
        getClusterOptions(
          {
            baseUrl: cluster.thor_host + ':' + cluster.thor_port,
            userID: clusterAuth ? clusterAuth.user : '',
            password: clusterAuth ? clusterAuth.password : '',
            type: 'get',
          },
          cluster.allowSelfSigned
        )
      );

      const response = await wsWorkunits.WUListQueries({
        QueryName: '*' + req.body.keyword + '*',
        QuerySetName: 'roxie',
        Activated: true,
      });

      if (response.QuerysetQueries) {
        querySearchResult = response.QuerysetQueries.QuerySetQuery;
        querySearchResult.forEach(querySet => {
          querySearchAutoComplete.push({
            id: querySet.Id,
            text: querySet.Name,
            value: querySet.Name,
          });
        });
        querySearchAutoComplete = querySearchAutoComplete.filter(
          (elem, index, self) =>
            self.findIndex(t => {
              return t.text === elem.text;
            }) === index
        );
      }

      return res.status(200).json(querySearchAutoComplete);
    } catch (err) {
      logger.error('Error occured while querying : ' + JSON.stringify(err));
      return res.status(500).send({
        success: 'false',
        message: 'Search failed. Error occured while querying.',
      });
    }
  }
);
router.post(
  '/jobsearch',
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

      //If no * add to start and end
      // If there are one or more astrik leave as they are
      let jobName = keyword.includes('*') ? keyword : `*${keyword}*`;
      const response = await wuService.WUQuery({
        Jobname: jobName,
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
                CompileCost: wu.CompileCost,
              };
            return acc;
          },
          {}
        );
        workunitsResult = Object.values(workunitsHash);
      }
      return res.status(200).send(workunitsResult);
    } catch (error) {
      logger.error('jobsearch error', error);
      return res.status(500).send({
        success: 'false',
        message: 'Search failed. Please check if the cluster is running.',
      });
    }
  }
);

router.get('/getClusters', async (req, res) => {
  try {
    const clusters = await Cluster.findAll({
      attributes: { exclude: ['hash', 'username', 'metaData'] },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(clusters);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({
      success: 'false',
      message: 'Error occurred while retrieving cluster list',
    });
  }
});

router.get('/getClusterWhitelist', function (req, res) {
  try {
    return res.status(200).json(ClusterWhitelist.clusters);
  } catch (err) {
    logger.error('err', err);
    return res.status(500).json({ error: 'Failed to get cluster white list ' });
  }
});

router.get('/getCluster', async function (req, res) {
  try {
    const clusters = await Cluster.findOne({
      where: { id: req.query.cluster_id },
    });
    return res.status(200).json(clusters);
  } catch (err) {
    logger.error('err', err);
    return res.status(500).json({ error: 'Failed to get cluster ' });
  }
});

router.post(
  '/newcluster',
  [
    body('name')
      .matches(/^[a-zA-Z0-9_:\s\-]*$/)
      .withMessage('Invalid name'),
    body('id')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid id'),
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
        cluster => cluster.name == req.body.name
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
          if (req.body.id == undefined || req.body.id == '') {
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
              return res.status(200).json({
                success: true,
                message: 'Successfully added new cluster',
              });
            } else {
              return res.status(400).json({
                success: false,
                message:
                  'Failure to add Cluster, Timezone Offset could not be found',
              });
            }
          } else {
            //get clusterTimezoneOFfset once ID is available after cluster creation
            const offset = await hpccUtil.getClusterTimezoneOffset(req.body.id);
            if (offset) {
              newCluster.timezone_offset = offset;
              await Cluster.update(newCluster, { where: { id: req.body.id } });
              return res.status(200).json({
                success: true,
                message: 'Successfully updated cluster',
              });
            } else {
              return res.status(400).json({
                success: false,
                message:
                  'Failure to add Cluster, Timezone Offset could not be found',
              });
            }
          }
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'Cluster could not be reached' });
        }
      }
    } catch (err) {
      logger.error('err', err);
      return res.status(500).send({
        success: 'false',
        message: 'Error occurred while adding new Cluster',
      });
    }
  }
);

router.post('/removecluster', function (req, res) {
  logger.info(`Deleting clusters: ${req.body.clusterIdsToDelete}`);
  try {
    Cluster.destroy(
      { where: { id: req.body.clusterIdsToDelete } },
      function (err) {
        logger.error(err);
      }
    );
    return res.status(200).send({ result: 'success' });
  } catch (err) {
    logger.error('err', err);
  }
});

router.get(
  '/getFileInfo',
  [
    query('fileName').exists().withMessage('Invalid file name'),
    query('clusterid')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid cluster id'),
    query('applicationId').isUUID(4).withMessage('Invalid application id'),
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
        attributes: ['id'],
      });
      const data = file
        ? await assetUtil.fileInfo(applicationId, file.id)
        : await hpccUtil.fileInfo(fileName, clusterid);
      return res.status(200).json(data);
    } catch (error) {
      logger.error(error);
      return res.status(500).send('Error occurred while getting file details');
    }
  }
);

// Gets file detail straight from HPCC  regardless of whether it exists in Tombolo DB
router.get(
  '/getLogicalFileDetails',
  [
    query('fileName').exists().withMessage('Invalid file name'),
    query('clusterid')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid cluster id'),
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
      return res.status(200).json(details);
    } catch (error) {
      logger.error(error);
      return res.status(500).send('Error occurred while getting file details');
    }
  }
);

router.get(
  '/getIndexInfo',
  [
    query('indexName')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid index name'),
    query('clusterid').isUUID(4).withMessage('Invalid cluster id'),
    query('applicationId').isUUID(4).withMessage('Invalid application id'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const existingIndex = await Index.findOne({
        where: {
          name: req.query.indexName,
          application_id: req.query.applicationId,
        },
      });

      if (existingIndex) {
        const existingIndexInfo = await assetUtil.indexInfo(
          req.query.applicationId,
          existingIndex.id
        );

        return res.status(200).json(existingIndexInfo);
      } else {
        const indexInfo = await hpccUtil.indexInfo(
          req.query.clusterid,
          req.query.indexName
        );

        return res.status(200).json(indexInfo);
      }
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Error occured while getting file details');
    }
  }
);

// NOT USED
// function getIndexColumns(cluster, indexName) {
//   let columns = {};
//   return requestPromise
//     .get({
//       url:
//         cluster.thor_host +
//         ':' +
//         cluster.thor_port +
//         '/WsDfu/DFUGetFileMetaData.json?LogicalFileName=' +
//         indexName,
//       auth: hpccUtil.getClusterAuth(cluster),
//     })
//     .then(function (response) {
//       var result = JSON.parse(response);
//       if (result.DFUGetFileMetaDataResponse != undefined) {
//         var indexColumns =
//             result.DFUGetFileMetaDataResponse.DataColumns.DFUDataColumn,
//           nonkeyedColumns = [],
//           keyedColumns = [];
//         if (indexColumns != undefined) {
//           indexColumns.forEach(function (column) {
//             if (column.IsKeyedColumn) {
//               keyedColumns.push({
//                 id: column.ColumnID,
//                 name: column.ColumnLabel,
//                 type: column.ColumnType,
//                 eclType: column.ColumnEclType,
//               });
//             } else if (!column.IsKeyedColumn) {
//               nonkeyedColumns.push({
//                 id: column.ColumnID,
//                 name: column.ColumnLabel,
//                 type: column.ColumnType,
//                 eclType: column.ColumnEclType,
//               });
//             }
//           });
//           columns.nonKeyedColumns = nonkeyedColumns;
//           columns.keyedColumns = keyedColumns;
//         }
//       }
//       return columns;
//     })
//     .catch(function (err) {
//       logger.error(err);
//     });
// }

router.get(
  '/getData',
  [
    query('clusterid').isUUID(4).withMessage('Invalid cluster id'),
    query('fileName')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid file name'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const cluster = await hpccUtil.getCluster(req.query.clusterid);

      let clusterAuth = hpccUtil.getClusterAuth(cluster);
      let wuService = new hpccJSComms.WorkunitsService(
        getClusterOptions(
          {
            baseUrl: cluster.thor_host + ':' + cluster.thor_port,
            userID: clusterAuth ? clusterAuth.user : '',
            password: clusterAuth ? clusterAuth.password : '',
          },
          cluster.allowSelfSigned
        )
      );

      const response = await wuService.WUResult({
        LogicalName: req.query.fileName,
        Cluster: 'mythor',
        Count: 50,
      });

      if (
        response.Result != undefined &&
        response.Result != undefined &&
        response.Result.Row != undefined
      ) {
        const rows = response.Result.Row;

        if (rows.length > 0) {
          rows.shift();
          return res.status(200).json(rows);
        }
      }

      return res.status(200).json([]);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Error occured while getting file data');
    }
  }
);

router.get('/getFileProfile', async function (req, res) {
  try {
    const cluster = await hpccUtil.getCluster(req.query.clusterid);
    const response = await axios.get(
      `${cluster.thor_host}:${cluster.thor_port}/WsWorkunits/WUResult.json?LogicalName=${req.query.fileName}.profile`,
      {
        auth: hpccUtil.getClusterAuth(cluster),
      }
    );

    const result = response.data;
    if (result.Exceptions) {
      // TODO: Should this return an error status code?
      return res.json([]);
    }

    if (result.WUResultResponse?.Result?.Row) {
      const rows = result.WUResultResponse.Result.Row;
      if (rows.length > 0) {
        rows.forEach(row => {
          Object.keys(row).forEach(key => {
            if (row[key] instanceof Object && row[key].Row) {
              row[key] = row[key].Row;
            }
          });
        });
        return res.status(200).json(rows);
      }
    }
    return res.status(200).json();
  } catch (err) {
    logger.error(err);
    return res.status(500).send('Error');
  }
});

router.get('/getFileProfileHTML', async function (req, res) {
  try {
    const cluster = await hpccUtil.getCluster(req.query.clusterid); //call DFUInfo to get workunit id
    const wuid = req.query.dataProfileWuid; //get resource url's from wuinfo

    const response = await axios.post(
      `${cluster.thor_host}:${cluster.thor_port}/WsWorkunits/WUInfo.json`,
      new URLSearchParams({
        Wuid: wuid,
        TruncateEclTo64k: true,
        IncludeResourceURLs: true,
        IncludeExceptions: false,
        IncludeGraphs: false,
        IncludeSourceFiles: false,
        IncludeResults: false,
        IncludeResultsViewNames: false,
        IncludeVariables: false,
        IncludeTimers: false,
        IncludeDebugValues: false,
        IncludeApplicationValues: false,
        IncludeWorkflows: false,
        IncludeXmlSchemas: false,
        SuppressResultSchemas: true,
      }).toString(),
      {
        auth: hpccUtil.getClusterAuth(cluster),
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }
    );

    const result = response.data;
    const filteredUrl = result.WUInfoResponse.Workunit.ResourceURLs.URL.filter(
      url => !url.startsWith('manifest')
    ).map(
      url =>
        `${cluster.thor_host}:${cluster.thor_port}/WsWorkunits/${url.replace('./report', 'report')}`
    );

    logger.info(`URL's: ${JSON.stringify(filteredUrl)}`);
    return res.status(200).json(filteredUrl);
  } catch (err) {
    logger.error(err);
    return res.status(500).send('Error');
  }
});

router.get(
  '/getQueryInfo',
  [
    query('clusterid').isUUID(4).withMessage('Invalid cluster id'),
    query('queryName')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid query name'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const existingQuery = await Query.findOne({
        where: {
          name: req.query.queryName,
          application_id: req.query.applicationId,
        },
      });

      if (existingQuery) {
        const existingQueryInfo = await assetUtil.queryInfo(
          req.query.applicationId,
          existingQuery.id
        );
        return res.status(200).json(existingQueryInfo);
      } else {
        const queryInfo = await hpccUtil.queryInfo(
          req.query.clusterid,
          req.query.queryName
        );
        return res.status(200).json(queryInfo);
      }
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Error occured while getting file details');
    }
  }
);

router.get(
  '/getQueryFiles',
  [
    query('hpcc_queryId')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid hpcc query id'),
    query('clusterId').isUUID(4).withMessage('Invalid cluster id'),
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
        QuerySet: 'roxie',
      });

      return res.status(200).json({
        success: true,
        logicalFiles: response?.LogicalFiles?.Item || [],
        superFiles: response?.SuperFiles?.SuperFile || [],
      });
    } catch (err) {
      logger.error(err);
      return res
        .status(503)
        .json({ success: false, message: 'Error while fetching query files' });
    }
  }
);
router.get(
  '/getJobInfo',
  [
    query('clusterid').isUUID(4).withMessage('Invalid cluster id'),
    query('jobWuid')
      .matches(/^[a-zA-Z]{1}[a-zA-Z0-9_:.\-]*$/)
      .withMessage('Invalid workunit id'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const existingJob = await Job.findOne({
        where: {
          name: req.query.jobName,
          cluster_id: req.query.clusterid,
          application_id: req.query.applicationId,
        },
        attributes: ['id'],
      });

      if (!existingJob) {
        const jobInfo = await hpccUtil.getJobInfo(
          req.query.clusterid,
          req.query.jobWuid,
          req.query.jobType
        );

        return res.status(200).json(jobInfo);
      }

      const existingJobInfo = await assetUtil.jobInfo(
        req.query.applicationId,
        existingJob.id
      );

      return res.status(200).json(existingJobInfo);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Error occurred while getting job info');
    }
  }
);

router.get(
  '/getDropZones',
  [query('clusterId').isUUID(4).withMessage('Invalid cluster id')],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const cluster = await hpccUtil.getCluster(req.query.clusterId);
      const url = `${cluster.thor_host}:${cluster.thor_port}/WsTopology/TpDropZoneQuery.json`;

      const response = await axios.get(url, {
        auth: hpccUtil.getClusterAuth(cluster),
      });

      const result = response.data;
      const dropZones = result.TpDropZoneQueryResponse.TpDropZones.TpDropZone;
      const _dropZones = {};
      const dropZoneDetails = [];

      dropZones.forEach(dropzone => {
        dropZoneDetails.push({
          name: dropzone.Name,
          path: dropzone.Path,
          machines: dropzone.TpMachines.TpMachine,
        });
        _dropZones[dropzone.Name] = [];
        lodash.flatMap(dropzone.TpMachines.TpMachine, tpMachine => {
          _dropZones[dropzone.Name] = _dropZones[dropzone.Name].concat([
            tpMachine.Netaddress,
          ]);
        });
      });

      if (
        req.query.for === 'fileUpload' ||
        req.query.for === 'manualJobSearch' ||
        req.query.for === 'lzFileExplorer'
      ) {
        return res.status(200).json(dropZoneDetails);
      } else {
        return res.status(200).json(_dropZones);
      }
    } catch (err) {
      logger.error(err);
      return res.status(500).json({
        success: false,
        message: 'Error occurred while getting dropzones',
      });
    }
  }
);
router.get('/dropZoneDirectories', async (req, res) => {
  try {
    const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;
    const directories = await hpccUtil.getDirectories({
      clusterId,
      Netaddr,
      Path,
      DirectoryOnly,
    });
    return res.status(200).send(directories);
  } catch (error) {
    logger.error('Failed to find directories', error);
    return res.status(500).send({ message: error.message });
  }
});

router.get(
  '/getDropZones',
  [query('clusterId').isUUID(4).withMessage('Invalid cluster id')],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const cluster = await hpccUtil.getCluster(req.query.clusterId);
      const url = `${cluster.thor_host}:${cluster.thor_port}/WsTopology/TpDropZoneQuery.json`;

      const response = await axios.get(url, {
        auth: hpccUtil.getClusterAuth(cluster),
      });

      const result = response.data;
      const dropZones = result.TpDropZoneQueryResponse.TpDropZones.TpDropZone;
      const _dropZones = {};
      const dropZoneDetails = [];

      dropZones.map(dropzone => {
        dropZoneDetails.push({
          name: dropzone.Name,
          path: dropzone.Path,
          machines: dropzone.TpMachines.TpMachine,
        });
        _dropZones[dropzone.Name] = [];
        lodash.flatMap(dropzone.TpMachines.TpMachine, tpMachine => {
          _dropZones[dropzone.Name] = _dropZones[dropzone.Name].concat([
            tpMachine.Netaddress,
          ]);
        });
      });

      if (
        req.query.for === 'fileUpload' ||
        req.query.for === 'manualJobSearch' ||
        req.query.for === 'lzFileExplorer'
      ) {
        return res.status(200).json(dropZoneDetails);
      }
      return res.status(200).json(_dropZones);
    } catch (err) {
      logger.error(err);
      return res.status(500).json({
        success: false,
        message: 'Error occurred while getting dropzones',
      });
    }
  }
);

router.get(
  '/dropZoneDirectoryDetails',
  [
    query('clusterId').exists().withMessage('Invalid cluster ID'),
    query('Netaddr').exists().withMessage('Invalid Netaddr'),
    query('DirectoryOnly')
      .exists()
      .withMessage(
        'Invalid directory only value. It should be either true or false'
      ),
    query('Path').exists().withMessage('Invalid path'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;
    logger.info('Cluster id etc. ', clusterId, Netaddr, Path, DirectoryOnly);
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
      if (directories.FileListResponse?.files) {
        const { PhysicalFileStruct: assets } =
          directories.FileListResponse.files;
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
                'seconds'
              );
              if (diff > 0) oldestFile = asset;
            }
          }
        }
        logger.info(assets);
      }
      const directoryDetails = {
        fileCount,
        directoryCount,
        oldestFile,
        filesAndDirectories: allAssets,
      };
      return res.status(200).json(directoryDetails);
    } catch (err) {
      logger.error(err);
      return res.status(503).json({ success: false, message: err.message });
    }
  }
);

router.post(
  '/dropZoneFileSearch',
  [
    body('clusterId').isUUID(4).withMessage('Invalid cluster id'),
    body('dropZoneName')
      .matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]*$/)
      .withMessage('Invalid dropzone name'),
    body('server')
      .matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]/)
      .withMessage('Invalid server'),
    body('nameFilter')
      .matches(/^[a-zA-Z0-9]{1}[a-zA-Z0-9_:\-.]*$/)
      .withMessage('Invalid file filter'),
  ],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const cluster = await hpccUtil.getCluster(req.body.clusterId);
      const response = await axios.post(
        `${cluster.thor_host}:${cluster.thor_port}/FileSpray/DropZoneFileSearch.json`,
        new URLSearchParams({
          DropZoneName: req.body.dropZoneName,
          Server: req.body.server,
          NameFilter: `*${req.body.nameFilter}*`,
          '__dropZoneMachine.label': req.body.server,
          '__dropZoneMachine.value': req.body.server,
          '__dropZoneMachine.selected': true,
          rawxml_: true,
        }).toString(),
        {
          auth: hpccUtil.getClusterAuth(cluster),
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
        }
      );

      const result = response.data;
      let files = [];
      if (result?.DropZoneFileSearchResponse?.Files?.PhysicalFileStruct) {
        files = result.DropZoneFileSearchResponse.Files.PhysicalFileStruct;
      }
      return res.status(200).send(files);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Error occurred during dropzone file search');
    }
  }
);

router.get(
  '/getSuperFileDetails',
  [
    query('fileName').exists().withMessage('Invalid file name'),
    query('clusterid')
      .optional({ checkFalsy: true })
      .isUUID(4)
      .withMessage('Invalid cluster id'),
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

      return res.status(200).json(details);
    } catch (error) {
      logger.error(error);
      return res.status(500).send('Error occurred while getting file details');
    }
  }
);

router.post(
  '/executeSprayJob',
  [body('jobId').isUUID(4).withMessage('Invalid cluster id')],
  async function (req, res) {
    const errors = validationResult(req).formatWith(
      validatorUtil.errorFormatter
    );
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const job = await Job.findOne({
        where: { id: req.body.jobId },
        attributes: { exclude: ['assetId'] },
      });

      const cluster = await hpccUtil.getCluster(job.cluster_id);
      const sprayPayload = {
        destGroup: 'mythor',
        DFUServerQueue: 'dfuserver_queue',
        namePrefix: job.sprayedFileScope,
        targetName: job.sprayFileName,
        overwrite: 'on',
        sourceIP: job.sprayDropZone,
        sourcePath: `/var/lib/HPCCSystems/mydropzone/${job.sprayFileName}`,
        destLogicalName: `${job.sprayedFileScope}::${job.sprayFileName}`,
        rawxml_: 1,
        sourceFormat: 1,
        sourceCsvSeparate: ',',
        sourceCsvTerminate: '\n,\r\n',
        sourceCsvQuote: '"',
      };

      logger.info(sprayPayload);

      const response = await axios.post(
        `${cluster.thor_host}:${cluster.thor_port}/FileSpray/SprayVariable.json`,
        new URLSearchParams(sprayPayload).toString(),
        {
          auth: hpccUtil.getClusterAuth(cluster),
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
        }
      );

      return res.status(200).send(response.data);
    } catch (err) {
      logger.error(err);
      return res.status(500).send('Error occurred during dropzone file search');
    }
  }
);
router.get(
  '/clusterMetaData',
  [query('clusterId').isUUID(4).withMessage('Invalid cluster Id')],
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
      const { thor_host, thor_port, username, hash, allowSelfSigned } = cluster;
      const clusterDetails = getClusterOptions(
        {
          baseUrl: `${thor_host}:${thor_port}`,
          userID: username || '',
          password: hash || '',
        },
        allowSelfSigned
      );
      const topologyService = new hpccJSComms.TopologyService(clusterDetails);
      const tpServiceQuery = await topologyService.TpServiceQuery({
        Type: 'ALLSERVICES',
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

      return res.status(200).send(clusterMetaData);
    } catch (err) {
      logger.error(err);
      return res.status(503).json({ success: false, message: err });
    }
  }
);

module.exports = router;

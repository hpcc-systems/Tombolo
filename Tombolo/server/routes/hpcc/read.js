const express = require('express');
const router = express.Router();
const axios = require('axios');
const hpccUtil = require('../../utils/hpcc-util');
const assetUtil = require('../../utils/assets');
const { encryptString } = require('../../utils/cipher');
const { Cluster, File, Query, Indexes: Index, Job } = require('../../models');
let hpccJSComms = require('@hpcc-js/comms');

const { validate } = require('../../middlewares/validateRequestBody');
const {
  validateFileSearch,
  validateSuperfileSearch,
  validateQuerySearch,
  // validateJobSearch,
  validateGetFileInfo,
  validateGetLogicalFileDetails,
  validateGetIndexInfo,
  validateGetData,
  validateGetQueryInfo,
  validateGetQueryFiles,
  validateGetJobInfo,
  validateGetDropZones,
  validateDropZoneDirectoryDetails,
  validateDropZoneFileSearch,
  validateGetSuperfileDetails,
  validateExecuteSprayJob,
  validateClusterMetaData,
} = require('../../middlewares/hpccMiddleware');

const lodash = require('lodash');

const logger = require('../../config/logger');
const moment = require('moment');
const { getClusterOptions } = require('../../utils/getClusterOptions');

router.post(
  '/filesearch',
  validate(validateFileSearch),
  async function (req, res) {
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
  validate(validateSuperfileSearch),
  async function (req, res) {
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
        message:
          'Error occurred during search. Please check if the cluster is running.',
      });
    }
  }
);
router.post(
  '/querysearch',
  validate(validateQuerySearch),
  async function (req, res) {
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
        const querySearchResult = response.QuerysetQueries.QuerySetQuery;
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
  // validate(validateJobSearch),
  async function (req, res) {
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

router.get('/getFileInfo', validate(validateGetFileInfo), async (req, res) => {
  try {
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
});

// Gets file detail straight from HPCC regardless of whether it exists in Tombolo DB
router.get(
  '/getLogicalFileDetails',
  validate(validateGetLogicalFileDetails),
  async (req, res) => {
    try {
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
  validate(validateGetIndexInfo),
  async function (req, res) {
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

router.get('/getData', validate(validateGetData), async function (req, res) {
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

    if (response.Result !== undefined && response.Result.Row !== undefined) {
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
});

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
  validate(validateGetQueryInfo),
  async function (req, res) {
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
  validate(validateGetQueryFiles),
  async function (req, res) {
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
  validate(validateGetJobInfo),
  async function (req, res) {
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
  validate(validateGetDropZones),
  async function (req, res) {
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
  '/dropZoneDirectoryDetails',
  validate(validateDropZoneDirectoryDetails),
  async (req, res) => {
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
  validate(validateDropZoneFileSearch),
  async function (req, res) {
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
  validate(validateGetSuperfileDetails),
  async (req, res) => {
    try {
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
  validate(validateExecuteSprayJob),
  async function (req, res) {
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
  validate(validateClusterMetaData),
  async (req, res) => {
    try {
      const { clusterId } = req.query;
      //Validate cluster Id
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

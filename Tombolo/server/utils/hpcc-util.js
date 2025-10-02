const axios = require('axios');
const path = require('path');
const {
  Cluster,
  DataflowClusterCredential,
  GithubRepoSetting,
} = require('../models');
let hpccJSComms = require('@hpcc-js/comms');
const { decryptString } = require('./cipher');
const { getClusterOptions } = require('../utils/getClusterOptions');

const simpleGit = require('simple-git');
const cp = require('child_process');
const fs = require('fs');
const logger = require('../config/logger');

exports.fileInfo = async (fileName, clusterId) => {
  try {
    const dfuService = await exports.getDFUService(clusterId);
    const fileInfo = await dfuService.DFUInfo({ Name: fileName });

    if (fileInfo.Exceptions?.Exception) throw fileInfo.Exceptions.Exception[0];

    const cluster = await module.exports.getCluster(clusterId);
    const layout = await getFileLayout(
      cluster,
      fileName,
      fileInfo.FileDetail.Format
    );

    return {
      basic: {
        name: fileInfo.FileDetail.Name,
        fileName: fileInfo.FileDetail.Filename,
        description: fileInfo.FileDetail.Description,
        scope: fileInfo.FileDetail.Name.substring(
          0,
          fileInfo.FileDetail.Name.lastIndexOf('::')
        ),
        pathMask: fileInfo.FileDetail.PathMask,
        isSuperfile: fileInfo.FileDetail.isSuperfile,
        fileType:
          fileInfo.FileDetail.ContentType ||
          fileInfo.FileDetail.Format ||
          'thor_file',
        metaData: { layout },
      },
      file_validations: [],
    };
  } catch (error) {
    logger.error('hpcc-util - fileInfo: ', error);
    throw error;
  }
};

// Gets details about the file without modifying anything - just whatever jscomms gives
exports.logicalFileDetails = async (fileName, clusterId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dfuService = await exports.getDFUService(clusterId);
      const { FileDetail } = await dfuService.DFUInfo({ Name: fileName });

      if (FileDetail.Exceptions?.Exception) {
        reject(FileDetail.Exceptions.Exception[0]);
      } else {
        resolve(FileDetail);
      }
    } catch (err) {
      reject(err);
    }
  });
};

function getIndexColumns(cluster, indexName) {
  let columns = {};
  return requestPromise
    .get({
      url:
        cluster.thor_host +
        ':' +
        cluster.thor_port +
        '/WsDfu/DFUGetFileMetaData.json?LogicalFileName=' +
        indexName,
      auth: module.exports.getClusterAuth(cluster),
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
      logger.error('error occured: ' + err);
    });
}

exports.indexInfo = (clusterId, indexName) => {
  return new Promise((resolve, reject) => {
    try {
      module.exports.getCluster(clusterId).then(function (cluster) {
        let clusterAuth = module.exports.getClusterAuth(cluster);
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
        dfuService.DFUInfo({ Name: indexName }).then(response => {
          if (response.FileDetail) {
            let indexInfo = {};
            getIndexColumns(cluster, indexName).then(function (indexColumns) {
              indexInfo.basic = {
                name: response.FileDetail.Name,
                title: response.FileDetail.Filename,
                description: response.FileDetail.Description,
                qualifiedPath: response.FileDetail.PathMask,
                index_keys: indexColumns.keyedColumns,
                index_payloads: indexColumns.nonKeyedColumns,
                Wuid: response.FileDetail.Wuid,
                jobName: response.FileDetail.JobName,
              };
              resolve(indexInfo);
            });
          } else {
            resolve({});
          }
        });
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getDirectories = async ({
  clusterId,
  Netaddr,
  Path,
  DirectoryOnly,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const cluster = await this.getCluster(clusterId);
      const clusterDetails = getClusterOptions(
        {
          baseUrl: cluster.thor_host + ':' + cluster.thor_port,
          userID: cluster.username || '',
          password: cluster.hash || '',
        },
        cluster.allowSelfSigned
      );
      const fileSprayService = new hpccJSComms.FileSprayService(clusterDetails);

      const fileList = await fileSprayService.FileList({
        DirectoryOnly,
        Netaddr,
        Path,
      });
      const result = fileList.files?.PhysicalFileStruct || [];
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

exports.executeSprayJob = async job => {
  // try {
  try {
    const cluster = await module.exports.getCluster(job.cluster_id);
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

    // logger.info(sprayPayload);

    const response = await axios.post(
      `${cluster.thor_host}:${cluster.thor_port}/FileSpray/SprayVariable.json`,
      new URLSearchParams(sprayPayload).toString(),
      {
        auth: module.exports.getClusterAuth(cluster),
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }
    );

    return response.data;
  } catch (err) {
    logger.error('ERROR - ', err);
    throw new Error('Error occurred during dropzone file search');
  }
};

exports.queryInfo = (clusterId, queryName) => {
  let resultObj = { basic: {} },
    requestObj = [],
    responseObj = [];
  try {
    return new Promise((resolve, reject) => {
      module.exports.getCluster(clusterId).then(function (cluster) {
        let clusterAuth = module.exports.getClusterAuth(cluster);
        let eclService = new hpccJSComms.EclService(
          getClusterOptions(
            {
              baseUrl: cluster.roxie_host + ':' + cluster.roxie_port,
              userID: clusterAuth ? clusterAuth.user : '',
              password: clusterAuth ? clusterAuth.password : '',
            },
            cluster.allowSelfSigned
          )
        );
        eclService
          .requestJson('roxie', queryName)
          .then(response => {
            if (response) {
              response.forEach((requestParam, idx) => {
                requestObj.push({
                  id: idx,
                  name: requestParam.id,
                  type: requestParam.type,
                  field_type: 'input',
                });
              });
            }
            //resultObj.basic.request = requestObj;

            eclService
              .responseJson('roxie', queryName)
              .then(response => {
                if (response) {
                  let firstKey = Object.keys(response)[0];
                  response[firstKey].forEach((responseParam, idx) => {
                    responseObj.push({
                      id: idx,
                      name: responseParam.id,
                      type: responseParam.type,
                      field_type: 'output',
                    });
                  });
                }
                //resultObj.basic.response = responseObj;
                resultObj.basic.query_fields = requestObj.concat(responseObj);
                resultObj.basic.name = queryName;
                resultObj.basic.title = queryName;
                resolve(resultObj);
              })
              .catch(function (err) {
                logger.error('error occured: ' + err);
                reject(err);
              });
          })
          .catch(function (err) {
            logger.error('error occured: ' + err);
            reject(err);
          });
      });
    });
  } catch (err) {
    model; // TODO: What is this
    logger.error('err', err);
  }
};

exports.getJobInfo = async (clusterId, jobWuid, jobType) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const wuInfo = await wuService.WUInfo({
      Wuid: jobWuid,
      IncludeECL: true,
      IncludeResults: true, // Will include output files
      IncludeSourceFiles: true, // Will include input files
      IncludeExceptions: true,
      IncludeTotalClusterTime: true,
    });

    if (!wuInfo || !wuInfo.Workunit)
      throw new Error(`Failed to get info for WU  - ${jobWuid}`);
    if (wuInfo.Exceptions?.Exception) throw wuInfo.Exceptions.Exception[0];

    // Helper method to construct result object
    const createJobInfoObj = (wu, files) => ({
      wuid: wu.Wuid,
      name: wu.Jobname,
      title: wu.Jobname,
      entryBWR: wu.Jobname,
      ecl: wu?.Query?.Text || '',
      description: wu.Description,
      jobfiles: sortFiles(files),
    });

    if (jobType === 'Query Build') {
      const wuListQueries = await wuService.WUListQueries({ WUID: jobWuid });
      // if QuerySetQuery has nothing then return empty jobInfo;
      if (!wuListQueries.QuerysetQueries?.QuerySetQuery?.length) return {};

      const queryDetails = await wuService.WUQueryDetails({
        QueryId: wuListQueries.QuerysetQueries.QuerySetQuery[0].Id,
        QuerySet: 'roxie',
      });

      const sourceFiles = queryDetails.LogicalFiles?.Item?.map(logicalFile => ({
        name: logicalFile,
        file_type: 'input',
      }));

      return createJobInfoObj(wuInfo.Workunit, sourceFiles);
    } else {
      const sourceFiles = [];

      wuInfo.Workunit?.SourceFiles?.ECLSourceFile?.forEach(sourceFile => {
        sourceFiles.push({
          name: sourceFile.Name,
          file_type: 'input',
          isSuperFile: sourceFile.IsSuperFile ? true : false,
        });
      });

      wuInfo.Workunit?.Results?.ECLResult?.forEach(file => {
        if (file.FileName)
          sourceFiles.push({
            name: file.FileName,
            file_type: 'output',
            isSuperFile: file.IsSuperFile ? true : false,
          });
      });
      return createJobInfoObj(wuInfo.Workunit, sourceFiles);
    }
  } catch (error) {
    logger.error('hpcc-util - getJobInfo: ', error);
    throw error;
  }
};

exports.getJobWuDetails = async (
  clusterId,
  jobName,
  dataflowId,
  clusterType = ''
) => {
  try {
    let wuService;

    if (!dataflowId) {
      wuService = await module.exports.getWorkunitsService(clusterId);
    } else {
      const clusterCredentials = await DataflowClusterCredential.findOne({
        where: { dataflow_id: dataflowId },
        include: [Cluster],
      });
      if (!clusterCredentials) throw new Error('Failed to get dataflow creds');

      const { thor_host, thor_port, allowSelfSigned } =
        clusterCredentials.cluster.dataValues;

      const connectionSettings = getClusterOptions(
        {
          baseUrl: thor_host + ':' + thor_port,
          userID: clusterCredentials.cluster_username,
          password: decryptString(clusterCredentials.cluster_hash),
        },
        allowSelfSigned
      );

      wuService = new hpccJSComms.WorkunitsService(connectionSettings);
    }

    if (!wuService) throw new Error('Failed to get WorkunitsService');

    const WUQuery = await wuService.WUQuery({
      Jobname: jobName,
      Cluster: clusterType,
      PageSize: 1,
      PageStartFrom: 0,
    });
    const ECLWorkunit = WUQuery.Workunits?.ECLWorkunit?.[0];

    return ECLWorkunit
      ? { wuid: ECLWorkunit.Wuid, cluster: ECLWorkunit.Cluster, wuService }
      : null;
  } catch (error) {
    logger.error('hpcc-util - getJobWuDetails: ', error);
    throw error;
  }
};

exports.resubmitWU = async (clusterId, wuid, wucluster, dataflowId) => {
  let cluster_auth;

  if (dataflowId) {
    try {
      const clusterCred = await DataflowClusterCredential.findOne({
        where: { dataflow_id: dataflowId },
        include: [Cluster],
      });
      cluster_auth = {
        user: clusterCred.dataValues.cluster_username,
        password: decryptString(clusterCred.dataValues.cluster_hash),
      };
    } catch (error) {
      logger.error('hpcc-util - resubmitWU: ', error);
    }
  }

  try {
    const body = {
      WURunRequest: {
        Wuid: wuid,
        CloneWorkunit: true,
        Cluster: wucluster,
        Wait: 0,
      },
    };

    const cluster = await module.exports.getCluster(clusterId);

    const response = await axios.post(
      `${cluster.thor_host}:${cluster.thor_port}/WsWorkunits/WURun.json?ver_=1.8`,
      body,
      {
        auth: dataflowId
          ? cluster_auth
          : module.exports.getClusterAuth(cluster),
        headers: {
          'content-type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    // Handle axios errors
    if (error.response) {
      // Check for access denied in response body
      const responseBody =
        typeof error.response.data === 'string'
          ? error.response.data
          : JSON.stringify(error.response.data);

      if (responseBody.indexOf('Access Denied') > -1) {
        logger.error('hpcc-util - resubmitWU - access denied: ', error);
        throw new Error(
          'Access Denied -- Valid username and password required!'
        );
      }

      // For other HTTP errors, try to parse the response
      try {
        return error.response.data;
      } catch (parseError) {
        logger.error('hpcc-util - resubmitWU - parse error: ', parseError);
        throw parseError;
      }
    } else {
      logger.error('hpcc-util - resubmitWU: ', error);
      // Network or other errors
      throw error;
    }
  }
};

exports.workunitInfo = async (wuid, clusterId) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    return await wuService.WUInfo({
      Wuid: wuid,
      IncludeExceptions: true,
      IncludeSourceFiles: true,
      IncludeResults: true,
      IncludeTotalClusterTime: true,
      IncludeResultsViewNames: true,
    });
  } catch (error) {
    throw error;
  }
};

// RETURNS THE OUTPUT OF WORK UNIT
exports.workUnitOutput = async ({ wuid, clusterId }) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    return await wuService.WUResult({ Wuid: wuid });
  } catch (err) {
    logger.error('hpcc-util - workUnitOutput: ', err);
  }
};

const getFileLayout = async (cluster, fileName, format) => {
  try {
    const auth = module.exports.getClusterAuth(cluster);
    if (format == 'csv') {
      const response = await requestPromise.get({
        auth,
        url:
          cluster.thor_host +
          ':' +
          cluster.thor_port +
          '/WsDfu/DFURecordTypeInfo.json?Name=' +
          fileName,
      });
      const result = JSON.parse(response);
      const fields = result?.DFURecordTypeInfoResponse?.jsonInfo?.fields || [];
      return fields.map((field, idx) => ({
        id: idx,
        name: field.name,
        type: '',
        eclType: '',
        description: '',
        constraints: { inherited: [], own: [] },
      }));
    }

    const response = await requestPromise.get({
      auth,
      url:
        cluster.thor_host +
        ':' +
        cluster.thor_port +
        '/WsDfu/DFUGetFileMetaData.json?LogicalFileName=' +
        fileName,
    });
    const result = JSON.parse(response);
    const fileInfoResponse =
      result?.DFUGetFileMetaDataResponse?.DataColumns?.DFUDataColumn || [];

    const createLayoutObj = (column, index) => ({
      id: index,
      name: column.ColumnLabel,
      type: column.ColumnType,
      eclType: column.ColumnEclType,
      description: '',
      constraints: { inherited: [], own: [] },
    });

    const layoutResults = fileInfoResponse.reduce((acc, column, idx) => {
      if (column.ColumnLabel !== '__fileposition__') {
        const layout = createLayoutObj(column, idx);
        if (column.DataColumns)
          layout.children = column.DataColumns.DFUDataColumn.map(
            (childColumn, idx) => createLayoutObj(childColumn, idx)
          );
        acc.push(layout);
      }
      return acc;
    }, []);

    return layoutResults;
  } catch (error) {
    logger.error('hpcc-util - getFileLayout: ', error);
  }
};

exports.getClusterAuth = cluster => {
  let auth = {};
  if (cluster.username && cluster.hash) {
    (auth.user = cluster.username), (auth.password = cluster.hash);
    return auth;
  } else {
    return null;
  }
};

exports.getCluster = clusterId => {
  return new Promise(async (resolve, reject) => {
    try {
      let cluster = await Cluster.findOne({ where: { id: clusterId } });
      if (cluster == null) {
        throw new Error(`Cluster with id ${clusterId} not in database`);
      }
      if (cluster.hash) {
        cluster.hash = decryptString(cluster.hash);
      }

      let isReachable = await module.exports.isClusterReachable(
        cluster.thor_host,
        cluster.thor_port,
        cluster.username,
        cluster.hash
      );
      const { reached, statusCode } = isReachable;
      if (reached && statusCode === 200) {
        resolve(cluster);
      } else if (reached && statusCode === 403) {
        reject('Invalid cluster credentials');
      } else {
        reject(`${cluster.name} is  not reachable...`);
      }
    } catch (err) {
      logger.error('hpcc-util - getCluster: ', err);
      reject(err);
    }
  });
};

/**
 * Retrieves cluster objects for the given array of cluster IDs, including reachability and credential status.
 *
 * For each cluster:
 *   - Decrypts the password hash if present
 *   - Checks if the cluster is reachable and credentials are valid
 *   - Returns the cluster object if reachable and authorized
 *   - Returns an object with an error property if unreachable or unauthorized
 *
 * @param {string[]} clusterIds - Array of cluster IDs to fetch
 * @returns {Promise<Object[]>} Resolves to an array of cluster objects with an error key included if there were errors
 * @throws {Error} If there is a database or internal error
 */
exports.getClusters = async clusterIds => {
  try {
    const clusters = await Cluster.findAll({ where: { id: clusterIds } });
    const clusterPromises = clusters.map(async cluster => {
      try {
        if (cluster.hash) {
          cluster.hash = decryptString(cluster.hash);
        }

        const isReachable = await module.exports.isClusterReachable(
          cluster.thor_host,
          cluster.thor_port,
          cluster.username,
          cluster.hash
        );
        const { reached, statusCode } = isReachable;
        if (reached && statusCode === 200) {
          return cluster;
        } else if (reached && statusCode === 403) {
          return {
            error: 'Invalid cluster credentials',
            ...cluster,
          };
        } else {
          return {
            error: `${cluster.name} is not reachable...`,
            ...cluster,
          };
        }
      } catch (err) {
        return {
          error: `Error with cluster ${cluster.name}: ${err.message}`,
          ...cluster,
        };
      }
    });

    return await Promise.all(clusterPromises);
  } catch (error) {
    logger.error('hpcc-util - getClusters: ', error);
    throw error;
  }
};

/*
response :  undefined -> cluster not reached network issue or cluster not available
response.status : 200 -> Cluster reachable
response.status : 403 -> Cluster reachable but Unauthorized
*/

exports.isClusterReachable = async (clusterHost, port, username, password) => {
  let auth = {
    username: username || '',
    password: password || '',
  };

  try {
    const response = await axios.get(`${clusterHost}:${port}`, {
      auth: auth,
      timeout: 5000,
    });

    if (response.status === 200) {
      return { reached: true, statusCode: 200 };
    }
  } catch (error) {
    if (error.response) {
      // Server responded with an error status
      if (error.response.status === 401) {
        logger.error(`${clusterHost} - Access denied`, error);
        return { reached: true, statusCode: 403 };
      }
    } else {
      // Network error or timeout
      logger.error(`Checking cluster reachability - ${error.message}`);
    }

    return { reached: false, statusCode: 503 };
  }
};

exports.updateCommonData = (objArray, fields) => {
  if (objArray && objArray.length > 0) {
    Object.keys(fields).forEach(function (key, index) {
      objArray.forEach(function (obj) {
        obj[key] = fields[key];
      });
    });
  }
  return objArray;
};

exports.getWorkunitsService = async clusterId => {
  const cluster = await module.exports.getCluster(clusterId);
  const { hash, username, allowSelfSigned, thor_host, thor_port } = cluster;

  const connectionSettings = getClusterOptions(
    {
      baseUrl: thor_host + ':' + thor_port,
      userID: username ? username : '',
      password: hash ? hash : '',
    },
    allowSelfSigned
  );

  return new hpccJSComms.WorkunitsService(connectionSettings);
};

exports.getDFUService = async clusterId => {
  const cluster = await module.exports.getCluster(clusterId);
  const clusterAuth = module.exports.getClusterAuth(cluster);

  const connectionSettings = getClusterOptions(
    {
      baseUrl: cluster.thor_host + ':' + cluster.thor_port,
      userID: clusterAuth ? clusterAuth.user : '',
      password: clusterAuth ? clusterAuth.password : '',
    },
    cluster.allowSelfSigned
  );

  return new hpccJSComms.DFUService(connectionSettings);
};

exports.createWorkUnit = async (clusterId, WUbody = {}) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUCreate(WUbody);
    const wuid = respond.Workunit?.Wuid;
    if (!wuid) throw respond;
    return wuid;
  } catch (error) {
    logger.error('hpcc-util - createWorkUnit: ', error);
    const customError = new Error('Failed to create new Work Unit.');
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
  }
};

exports.updateWorkUnit = async (clusterId, WUupdateBody) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUUpdate(WUupdateBody);
    if (!respond.Workunit?.Wuid) throw respond; // assume that Wuid field is always gonna be in "happy" response
    return respond;
  } catch (error) {
    logger.error('hpcc-util - updateWorkUnit: ', error);
    const customError = new Error('Failed to update Work Unit.');
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
  }
};

exports.submitWU = async (clusterId, WUsubmitBody) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUSubmit(WUsubmitBody);
    if (respond.Exceptions) throw respond;
    return respond;
  } catch (error) {
    logger.error('hpcc-util - submitWU: ', error);
    const customError = new Error('Failed to submit Work Unit.');
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
  }
};

exports.updateWUAction = async (clusterId, WUactionBody) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUAction(WUactionBody);
    const result = respond.ActionResults?.WUActionResult?.[0]?.Result;
    if (!result || result !== 'Success') throw respond;
    logger.verbose('updateWuAction response: ', respond);
    logger.verbose('------------------------------------------');
    return respond;
  } catch (error) {
    logger.error('hpcc-util - updateWUAction: ', error);
    const customError = new Error('Failed to update Work Unit action');
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
  }
};

exports.pullFilesFromGithub = async (jobName = '', clusterId, gitHubFiles) => {
  const tasks = {
    repoCloned: false,
    repoDeleted: false,
    archiveCreated: false,
    WUCreated: false,
    WUupdated: false,
    WUsubmitted: false,
    WUaction: null,
    error: null,
  };
  let masterFolder;
  let wuService;
  let wuid;

  try {
    // initializing wuService to update hpcc.
    wuService = await module.exports.getWorkunitsService(clusterId);
    //  Create empty Work Unit;
    const createRespond = await wuService.WUCreate({});
    wuid = createRespond.Workunit?.Wuid;
    if (!wuid) {
      logger.error(
        '❌ pullFilesFromGithub: WUCreate error-----------------------------------------'
      );
      logger.error(createRespond);
      throw new Error('Failed to update Work Unit.');
    }
    tasks.WUCreated = true;
    logger.info(`✔️  pullFilesFromGithub: WUCreated-  ${wuid}`);

    // CLONING OPERATIONS
    // gitHubFiles = {
    //   selectedProjects // List of selected projects IDS! ['c1bdfedd-4be7-4391-9936-259b040786cd']
    //   selectedRepoId // Id of repo with main file "c1bdfedd-4be7-4391-9936-259b040786cd"
    //   selectedFile:{ // main file data
    //      download_url, git_url, html_url, id, isLeaf, label, name, owner, path, ref, repo, sha, size, type, url, value,
    //    }

    // Create one master folder that is going to hold all cloned repos, name of folder is newly created WUID number;
    masterFolder = path.join(process.cwd(), '..', 'gitClones', wuid);
    const dir = await fs.promises.mkdir(masterFolder, { recursive: true });
    logger.info('--dir created----------------------------------------');
    logger.info(dir);
    const git = simpleGit({ baseDir: masterFolder });

    const { selectedProjects } = gitHubFiles;

    //Loop through the reposList(contains GithubRepoSetting ids that has all gh project data including tokens) and clone each repo into master folder;
    for (const repoId of selectedProjects) {
      let project = await GithubRepoSetting.findOne({ where: { id: repoId } });
      if (!project) throw new Error('Failed to find GitHub project');

      project = project.toJSON();

      if (project.ghToken) project.ghToken = decryptString(project.ghToken);
      if (project.ghUserName)
        project.ghUserName = decryptString(project.ghUserName);

      let { ghLink, ghBranchOrTag, ghUserName, ghToken } = project;

      const ghProjectName = ghLink.split('/')[4];

      const clonePath = path.join(masterFolder, ghProjectName);
      // Add credentials to git request if they are present
      if (ghUserName && ghToken)
        ghLink =
          ghLink.slice(0, 8) +
          ghUserName +
          ':' +
          ghToken +
          '@' +
          ghLink.slice(8);

      logger.info(
        `✔️  pullFilesFromGithub: CLONING STARTED-${ghLink}, branch/tag: ${ghBranchOrTag}`
      );
      await git.clone(ghLink, clonePath, {
        '--branch': ghBranchOrTag,
        '--single-branch': true,
      });
      logger.info(
        `✔️  pullFilesFromGithub: CLONING FINISHED-${ghLink}, branch/tag: ${ghBranchOrTag}`
      );

      //Update submodules
      try {
        await git
          .cwd({ path: clonePath, root: true })
          .submoduleUpdate(['--init', '--recursive']);
        logger.info(
          `✔️  pullFilesFromGithub: SUBMODULES UPDATED ${ghLink}, branch/tag: ${ghBranchOrTag}`
        );
      } catch (error) {
        logger.error(
          'hpcc-util - pullFilesFromGithub - submoduleUpdate: ',
          error
        );
      } finally {
        // Switch back to root folder after updating submodules
        await git.cwd({ path: masterFolder, root: true });
      }
    }
    tasks.repoCloned = true;

    //Create a path to main file
    const { repo: ghProjectName, path: filePath } = gitHubFiles.selectedFile;

    const startFilePath = path.join(masterFolder, ghProjectName, filePath);

    let args = ['-E', startFilePath, '-I', masterFolder];
    const archived = await this.createEclArchive(args, masterFolder);

    tasks.archiveCreated = true;
    logger.info('✔️  pullFilesFromGithub: Archive Created');
    // logger.info(archived);

    // Update the Workunit with Archive XML
    const updateBody = {
      Wuid: wuid,
      Jobname: jobName,
      QueryText: archived.stdout,
    };
    const updateRespond = await wuService.WUUpdate(updateBody);
    if (!updateRespond.Workunit?.Wuid) {
      // assume that Wuid field is always gonna be in "happy" response
      logger.error(
        '❌  pullFilesFromGithub: WUupdate error----------------------------------------'
      );
      logger.error(updateRespond);
      throw new Error('Failed to update Work Unit.');
    }
    tasks.WUupdated = true;
    logger.info(`✔️  pullFilesFromGithub: WUupdated-  ${wuid}`);

    // Submit the Workunit to HPCC
    const submitBody = { Wuid: wuid, Cluster: 'thor' };
    const submitRespond = await wuService.WUSubmit(submitBody);
    if (submitRespond.Exceptions) {
      logger.error(
        '❌  pullFilesFromGithub: WUsubmit error---------------------------------------'
      );
      logger.error(submitRespond);
      throw new Error('Failed to submit Work Unit.');
    }
    tasks.WUsubmitted = true;
    logger.info(`✔️  pullFilesFromGithub: WUsubmitted-  ${wuid}`);
  } catch (error) {
    // Error going to have messages related to where in process error happened, it will end up in router.post('/executeJob' catch block.
    try {
      const WUactionBody = {
        Wuids: { Item: [wuid] },
        WUActionType: 'SetToFailed',
      };
      const actionRespond = await wuService.WUAction(WUactionBody);
      const result = actionRespond.ActionResults?.WUActionResult?.[0]?.Result;
      if (!result || result !== 'Success') {
        logger.error(
          '❌  pullFilesFromGithub: WUaction error-------------------------------------'
        );
        logger.error(actionRespond);
        throw actionRespond;
      }
      tasks.WUaction = actionRespond.ActionResults.WUActionResult;
    } catch (error) {
      error.message
        ? (tasks.WUaction = { message: error.message, failedToUpdate: true })
        : (tasks.WUaction = { ...error, failedToUpdate: true });
    }

    tasks.error = error;
    logger.error('hpcc-util - pullFilesFromGithub: ', error);
  } finally {
    // Delete repo;
    const isDeleted = deleteRepo(masterFolder);
    logger.info(
      `✔️  pullFilesFromGithub: CLEANUP, REPO DELETED SUCCESSFULLY-  ${masterFolder}`
    );
    tasks.repoDeleted = isDeleted;
    const summary = { wuid, ...tasks };
    return summary;
  }
};

const deleteRepo = masterFolder => {
  let isRepoDeleted;
  try {
    fs.rmSync(masterFolder, { recursive: true, maxRetries: 5, force: true });
    isRepoDeleted = true;
  } catch (err) {
    logger.error('hpcc-util - deleteRepo: ', err);
    logger.error(
      `❌  pullFilesFromGithub: Failed to delete a repo ${masterFolder}`
    );
    isRepoDeleted = false;
  }
  return isRepoDeleted;
};

let sortFiles = files => {
  return files.sort((a, b) => (a.name > b.name ? 1 : -1));
};

exports.createEclArchive = (args, cwd) => {
  return new Promise((resolve, reject) => {
    const child = cp.spawn('eclcc', args, { cwd: cwd });
    child.on('error', error => {
      error.message = 'Failed to create ECL Archive.  ' + error;
      reject(error);
    });
    let stdOut = '',
      stdErr = '';
    child.stdout.on('data', data => {
      stdOut += data.toString();
    });
    child.stderr.on('data', data => {
      stdErr += data.toString();
    });
    child.on('close', (_code, _signal) => {
      resolve({
        stdout: stdOut.trim(),
        stderr: stdErr.trim(),
      });
    });
  });
};

exports.constructFileMonitoringWorkUnitEclCode = ({
  wu_name,
  monitorSubDirs,
  lzHost,
  lzPath,
  filePattern,
}) => {
  return `IMPORT Std;
    #WORKUNIT('name', '${wu_name}');
    FOUND_FILE_EVENT_NAME := 'RECENT_FILES';
    LZ_HOST := '${lzHost}';
    LZ_PATH := '${lzPath}';
    FILENAME_PATTERN := '${filePattern}';

    WriteLog(STRING entry) := FUNCTION
        LOG_NAME := 'monitor_file_results';
        LogLayout := {STRING t, STRING s};
        // now := Std.Date.SecondsToString(Std.Date.CurrentSeconds(), '%Y-%m-%dT%H:%M:%S UTC');
        now := Std.Date.CurrentSeconds();
        e := DATASET([{now, entry}], LogLayout);
        RETURN OUTPUT(e, NAMED(LOG_NAME), overwrite);
        END;

    MonitorFileAction() := Std.File.MonitorFile
        (
            FOUND_FILE_EVENT_NAME,
            ip := LZ_HOST,
            filename := FILENAME_PATTERN,
            subDirs := ${monitorSubDirs},
            shotCount := -1
        );

      HandleFoundFileEvent(STRING fullFilePath) := FUNCTION
          RETURN SEQUENTIAL
              (
                    WriteLog('Found file: ' + fullFilePath);
              );
      END;

HandleFoundFileEvent(EVENTEXTRA) : WHEN(EVENT(FOUND_FILE_EVENT_NAME, '*'));
MonitorFileAction();`;
};

exports.getClusterTimezoneOffset = async clusterId => {
  try {
    const cluster = await module.exports.getCluster(clusterId);
    const { defaultEngine } = cluster;

    const wuService = await module.exports.getWorkunitsService(clusterId);

    const jobname = `timezone-offset-${process.env.INSTANCE_NAME}`;

    // Create empty WU, will give wuID
    const workUnit = await wuService.WUCreate(clusterId, {
      jobname,
    });

    const {
      Workunit: { Wuid },
    } = workUnit;

    // Timezone offset ECL code
    const timezoneOffsetEcl =
      'IMPORT Std; now := Std.Date.LocalTimeZoneOffset(); OUTPUT(now);';

    // Update the WU with ECL code
    await wuService.WUUpdate({
      QueryText: timezoneOffsetEcl,
      Wuid,
      JobnameOrig: jobname,
    });

    // Submit the WU
    await wuService.WUSubmit({
      Wuid,
      Cluster: defaultEngine,
    });

    // Get the WU result
    const result = await wuService.WUWaitComplete({
      Wuid,
      Wait: -1, // 3 minutes timeout
    });

    const { StateID } = result;
    const successState = 3;

    if (StateID !== successState) {
      throw new Error(`Timezone offset job failed with state: ${StateID}`);
    }

    // Get the WU result
    const wuResult = await wuService.WUResult({
      Wuid,
      SuppressXmlSchema: true,
    });

    const {
      Result: { Row },
    } = wuResult;
    const timeZoneOffsetInMinutes = Number(Row[0].Result_1) / 60;

    // if NaN throw error
    if (isNaN(timeZoneOffsetInMinutes)) {
      throw new Error('Invalid timezone offset result');
    }

    return Math.floor(timeZoneOffsetInMinutes);
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.getSuperFile = async (clusterId, fileName) => {
  try {
    const dfuService = await exports.getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        'Error connecting to cluster when getting superfile information'
      );
    }
    //gets superfile, with size and count of subfiles
    let superFileList = await dfuService.DFUQuery({
      FileType: 'Superfiles only',
      LogicalName: fileName,
    });

    //output
    let output;
    //if one is found, build returns
    if (superFileList.DFULogicalFiles.DFULogicalFile[0]) {
      //get number of sub files
      let numSubFiles =
        superFileList.DFULogicalFiles.DFULogicalFile[0].NumOfSubfiles;

      //dfuService.SuperfileList gets the names of all the subfiles to iterate through, which dfuquery above does not
      let superFile = await dfuService.SuperfileList({
        superfile: fileName,
      });

      let returnSize;

      if (superFile.subfiles && superFile.subfiles.Item[0]) {
        if (superFileList.DFULogicalFiles.DFULogicalFile[0].IntSize) {
          returnSize = superFileList.DFULogicalFiles.DFULogicalFile[0].IntSize;
        } else {
          returnSize = 0;
        }
      } else {
        returnSize = 0;
      }

      let date = Date.now();

      let modifiedDate = new Date(
        superFileList.DFULogicalFiles.DFULogicalFile[0].Modified
      ).getTime();

      //create new superfile monitoring
      let newSuperFileMonitoring = {
        cluster_id: clusterId,
        superfile_name: fileName,
        size: returnSize,
        subfiles: numSubFiles,
        lastCheck: date,
        modified: modifiedDate,
      };

      output = newSuperFileMonitoring;
    } else {
      //return no file found
      output = 'No file found';
      throw new Error('No file found with that name');
    }

    return output;
  } catch (err) {
    logger.error('hpcc-util - getSuperFile: ', err);
  }
};

//get all superfiles
exports.getSuperFiles = async (clusterId, fileName) => {
  try {
    const dfuService = await exports.getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        'Error connecting to cluster when getting superfile information'
      );
    }

    //if no filename was passed in, just pass wildcard
    if (fileName) {
      searchName = fileName + '*';
    } else {
      searchName = '*';
    }

    //gets superfile, with size and count of subfiles
    let superFileList = await dfuService.DFUQuery({
      FileType: 'Superfiles only',
      LogicalName: searchName,
      FirstN: 100000000, //without this it will only grab the first 100
    });

    //build output
    let output = [];
    if (
      superFileList.DFULogicalFiles &&
      superFileList.DFULogicalFiles.DFULogicalFile.length > 0
    ) {
      let results = superFileList.DFULogicalFiles.DFULogicalFile;
      results.forEach(superFile => {
        output.push({
          text: superFile.Name,
          value: superFile.Name,
          superOwners: superFile.SuperOwners,
        });
      });
    } else {
      //return no file found
      output = 'No file found';
      throw new Error('No file found with that name');
    }
    return output;
  } catch (err) {
    logger.error('hpcc-util - getSuperFiles: ', err);
  }
};

//get all superfile subfiles
exports.getAllSubFiles = async (clusterId, fileName) => {
  try {
    const dfuService = await exports.getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        'Error connecting to cluster when getting superfile information'
      );
    }

    let output = [];

    //get list of superfile subfiles
    let superFile = await dfuService.SuperfileList({
      superfile: fileName,
    });

    let scopes = [];

    //if subfiles exist, loop through and get scopes
    if (superFile.subfiles && superFile.subfiles.Item) {
      //loop through and get all scopes to search
      for (let i = 0; i < superFile.subfiles.Item.length; i++) {
        let tempFileName = superFile.subfiles.Item[i];

        //remove last piece to get scope
        let split = tempFileName.split('::');

        let scope = split.splice(0, split.length - 1).join('::');

        scopes.push(scope);
      }
    }

    //remove duplicate scopes
    let finalScopes = scopes.filter(
      (item, index) => scopes.indexOf(item) === index
    );

    //loop through each scope, getting data and putting it in output
    for (let i = 0; i < finalScopes.length; i++) {
      let childSubfiles = await dfuService.DFUFileView({
        Scope: finalScopes[i],
        IncludeSuperOwner: true,
      });

      //loop through all files in directory
      for (
        let j = 0;
        j < childSubfiles.DFULogicalFiles.DFULogicalFile.length;
        j++
      ) {
        if (
          childSubfiles.DFULogicalFiles.DFULogicalFile[j].SuperOwners ==
          fileName
        ) {
          output.push({
            fileName: childSubfiles.DFULogicalFiles.DFULogicalFile[j].Name,
            isSuperFile:
              childSubfiles.DFULogicalFiles.DFULogicalFile[j].isSuperfile,
            Modified: childSubfiles.DFULogicalFiles.DFULogicalFile[j].Modified,
          });
        }
      }
    }

    return output;
  } catch (err) {
    logger.error('hpcc-util - getAllSubFiles: ', err);
  }
};

//get most recent sub file and sub file count (logical files only)
exports.getRecentSubFile = async (clusterId, fileName) => {
  try {
    let mostRecentSubFile = '';
    let recentDate = new Date('1970-01-01');
    let logicalFileCount = 0;

    //get all subfiles
    const subfiles = await exports.getAllSubFiles(clusterId, fileName);
    //check for child superfiles
    if (subfiles && subfiles.length > 0) {
      for (let i = 0; i < subfiles.length; i++) {
        //if superfile is found, get it's subfiles
        if (subfiles[i].isSuperFile) {
          let childSubfiles = await exports.getAllSubFiles(
            clusterId,
            subfiles[i].fileName
          );
          //add child files to list to be iterated through
          for (let j = 0; j < childSubfiles.length; j++) {
            subfiles.push({
              fileName: childSubfiles[j].fileName,
              isSuperFile: childSubfiles[j].isSuperFile,
              Modified: childSubfiles[j].Modified,
            });
          }
        }
      }

      //now that all subfiles are found, loop through and find most recently modified

      let tempDate;

      for (let i = 0; i < subfiles.length; i++) {
        tempDate = new Date(subfiles[i].Modified);
        if (
          recentDate.getTime() < tempDate.getTime() &&
          !subfiles[i].isSuperFile
        ) {
          recentDate = tempDate;
          mostRecentSubFile = subfiles[i].fileName;
          logicalFileCount++;
        }
      }
    }
    return {
      recentSubFile: mostRecentSubFile,
      recentDate: recentDate,
      subfileCount: logicalFileCount,
    };
  } catch (err) {
    logger.error('hpcc-util - getRecentSubFile: ', err);
  }
};

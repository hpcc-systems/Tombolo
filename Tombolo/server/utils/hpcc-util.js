var request = require("request");
const path = require("path");
var requestPromise = require("request-promise");
var models = require("../models");
var Cluster = models.cluster;
var SuperFileMonitoring = models.filemonitoring_superfiles;
const Dataflow_cluster_credentials = models.dataflow_cluster_credentials;
const { github_repo_settings: GHprojects } = require("../models");
let hpccJSComms = require("@hpcc-js/comms");
const { decryptString } = require("./cipher");

const simpleGit = require("simple-git");
const cp = require("child_process");
const fs = require("fs");
const logger = require("../config/logger");

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
          fileInfo.FileDetail.Name.lastIndexOf("::")
        ),
        pathMask: fileInfo.FileDetail.PathMask,
        isSuperfile: fileInfo.FileDetail.isSuperfile,
        fileType:
          fileInfo.FileDetail.ContentType ||
          fileInfo.FileDetail.Format ||
          "thor_file",
        metaData: { layout },
      },
      file_validations: [],
    };
  } catch (error) {
    console.log("-error fileInfo---------------------------");
    console.dir({ error }, { depth: null });
    console.log("------------------------------------------");
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
        ":" +
        cluster.thor_port +
        "/WsDfu/DFUGetFileMetaData.json?LogicalFileName=" +
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
      console.log("error occured: " + err);
    });
}

exports.indexInfo = (clusterId, indexName) => {
  return new Promise((resolve, reject) => {
    try {
      module.exports.getCluster(clusterId).then(function (cluster) {
        let clusterAuth = module.exports.getClusterAuth(cluster);
        let dfuService = new hpccJSComms.DFUService({
          baseUrl: cluster.thor_host + ":" + cluster.thor_port,
          userID: clusterAuth ? clusterAuth.user : "",
          password: clusterAuth ? clusterAuth.password : "",
        });
        dfuService.DFUInfo({ Name: indexName }).then((response) => {
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

const getConnection = async (clusterId) => {
  const cluster = await this.getCluster(clusterId);
  return {
    baseUrl: cluster.thor_host + ":" + cluster.thor_port,
    userID: cluster.username || "",
    password: cluster.hash || "",
  };
};

exports.getDirectories = async ({
  clusterId,
  Netaddr,
  Path,
  DirectoryOnly,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const clusterDetails = await getConnection(clusterId);
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

exports.executeSprayJob = (job) => {
  // try {
  return new Promise((resolve, reject) => {
    let cluster = module.exports
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
            auth: module.exports.getClusterAuth(cluster),
            headers: { "content-type": "application/x-www-form-urlencoded" },
            formData: sprayPayload,
            resolveWithFullResponse: true,
          },
          function (err, response, body) {
            if (err) {
              console.log("ERROR - ", err);
              reject("Error occured during dropzone file search");
            } else {
              var result = JSON.parse(body);
              resolve(result);
            }
          }
        );
      })
      .catch((error) => reject("Error occured during dropzone file search"));
  });
};

exports.queryInfo = (clusterId, queryName) => {
  let resultObj = { basic: {} },
    requestObj = [],
    responseObj = [];
  try {
    return new Promise((resolve, reject) => {
      module.exports.getCluster(clusterId).then(function (cluster) {
        let clusterAuth = module.exports.getClusterAuth(cluster);
        let eclService = new hpccJSComms.EclService({
          baseUrl: cluster.roxie_host + ":" + cluster.roxie_port,
          userID: clusterAuth ? clusterAuth.user : "",
          password: clusterAuth ? clusterAuth.password : "",
        });
        eclService
          .requestJson("roxie", queryName)
          .then((response) => {
            if (response) {
              response.forEach((requestParam, idx) => {
                requestObj.push({
                  id: idx,
                  name: requestParam.id,
                  type: requestParam.type,
                  field_type: "input",
                });
              });
            }
            //resultObj.basic.request = requestObj;

            eclService
              .responseJson("roxie", queryName)
              .then((response) => {
                if (response) {
                  let firstKey = Object.keys(response)[0];
                  response[firstKey].forEach((responseParam, idx) => {
                    responseObj.push({
                      id: idx,
                      name: responseParam.id,
                      type: responseParam.type,
                      field_type: "output",
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
                console.log("error occured: " + err);
                reject(err);
              });
          })
          .catch(function (err) {
            console.log("error occured: " + err);
            reject(err);
          });
      });
    });
  } catch (err) {
    model;
    console.log("err", err);
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
      ecl: wu?.Query?.Text || "",
      description: wu.Description,
      jobfiles: sortFiles(files),
    });

    if (jobType === "Query Build") {
      const wuListQueries = await wuService.WUListQueries({ WUID: jobWuid });
      // if QuerySetQuery has nothing then return empty jobInfo;
      if (!wuListQueries.QuerysetQueries?.QuerySetQuery?.length) return {};

      const queryDetails = await wuService.WUQueryDetails({
        QueryId: wuListQueries.QuerysetQueries.QuerySetQuery[0].Id,
        QuerySet: "roxie",
      });

      const sourceFiles = queryDetails.LogicalFiles?.Item?.map(
        (logicalFile) => ({
          name: logicalFile,
          file_type: "input",
        })
      );

      return createJobInfoObj(wuInfo.Workunit, sourceFiles);
    } else {
      const sourceFiles = [];

      wuInfo.Workunit?.SourceFiles?.ECLSourceFile?.forEach((sourceFile) => {
        sourceFiles.push({
          name: sourceFile.Name,
          file_type: "input",
          isSuperFile: sourceFile.IsSuperFile ? true : false,
        });
      });

      wuInfo.Workunit?.Results?.ECLResult?.forEach((file) => {
        if (file.FileName)
          sourceFiles.push({
            name: file.FileName,
            file_type: "output",
            isSuperFile: file.IsSuperFile ? true : false,
          });
      });
      return createJobInfoObj(wuInfo.Workunit, sourceFiles);
    }
  } catch (error) {
    console.log("-error getJobInfo--------------------------");
    console.dir({ error }, { depth: null });
    console.log("------------------------------------------");
    throw error;
  }
};

exports.getJobWuDetails = async (
  clusterId,
  jobName,
  dataflowId,
  clusterType = ""
) => {
  try {
    let wuService;

    if (!dataflowId) {
      wuService = await module.exports.getWorkunitsService(clusterId);
    } else {
      const clusterCredentials = await Dataflow_cluster_credentials.findOne({
        where: { dataflow_id: dataflowId },
        include: [Cluster],
      });
      if (!clusterCredentials) throw new Error("Failed to get dataflow creds");

      const { thor_host, thor_port } = clusterCredentials.cluster.dataValues;

      const connectionSettings = {
        baseUrl: thor_host + ":" + thor_port,
        userID: clusterCredentials.cluster_username,
        password: decryptString(clusterCredentials.cluster_hash),
      };

      wuService = new hpccJSComms.WorkunitsService(connectionSettings);
    }

    if (!wuService) throw new Error("Failed to get WorkunitsService");

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
    console.log("-ERROR getJobWuDetails--------------------");
    console.dir({ error }, { depth: null });
    console.log("------------------------------------------");
    throw error;
  }
};

exports.resubmitWU = async (clusterId, wuid, wucluster, dataflowId) => {
  let cluster_auth;

  if (dataflowId) {
    try {
      const clusterCred = await Dataflow_cluster_credentials.findOne({
        where: { dataflow_id: dataflowId },
        include: [Cluster],
      });
      cluster_auth = {
        user: clusterCred.dataValues.cluster_username,
        password: decryptString(clusterCred.dataValues.cluster_hash),
      };
    } catch (error) {
      console.log(error);
    }
  }

  return new Promise(async (resolve, reject) => {
    try {
      let body = {
        WURunRequest: {
          Wuid: wuid,
          CloneWorkunit: true,
          Cluster: wucluster,
          Wait: 0,
        },
      };
      let cluster = await module.exports.getCluster(clusterId);
      request.post(
        {
          url:
            cluster.thor_host +
            ":" +
            cluster.thor_port +
            "/WsWorkunits/WURun.json?ver_=1.8",
          auth: dataflowId
            ? cluster_auth
            : module.exports.getClusterAuth(cluster),
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        },
        function (err, response, body) {
          if (err) {
            console.log("ERROR - ", err);
            reject(err);
          } else {
            try {
              // If access denied - a response is a staring not parsable, ∴ doing this check
              const result = JSON.parse(body);
              resolve(result);
            } catch (err) {
              if (body.indexOf("Access Denied") > -1) {
                reject(
                  "Access Denied -- Valid username and password required!"
                );
                console.log(err);
              }
            }
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
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
    console.log("-- Error -----------------------------------------");
    console.dir({ err }, { depth: null });
    console.log("---------------------------------------------------");
  }
};

const getFileLayout = async (cluster, fileName, format) => {
  try {
    const auth = module.exports.getClusterAuth(cluster);
    if (format == "csv") {
      const response = await requestPromise.get({
        auth,
        url:
          cluster.thor_host +
          ":" +
          cluster.thor_port +
          "/WsDfu/DFURecordTypeInfo.json?Name=" +
          fileName,
      });
      const result = JSON.parse(response);
      const fields = result?.DFURecordTypeInfoResponse?.jsonInfo?.fields || [];
      return fields.map((field, idx) => ({
        id: idx,
        name: field.name,
        type: "",
        eclType: "",
        description: "",
        constraints: { inherited: [], own: [] },
      }));
    }

    const response = await requestPromise.get({
      auth,
      url:
        cluster.thor_host +
        ":" +
        cluster.thor_port +
        "/WsDfu/DFUGetFileMetaData.json?LogicalFileName=" +
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
      description: "",
      constraints: { inherited: [], own: [] },
    });

    const layoutResults = fileInfoResponse.reduce((acc, column, idx) => {
      if (column.ColumnLabel !== "__fileposition__") {
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
    console.log("-Error getFileLayout----------------------");
    console.dir({ error }, { depth: null });
    console.log("------------------------------------------");
  }
};

exports.getClusterAuth = (cluster) => {
  let auth = {};
  if (cluster.username && cluster.hash) {
    (auth.user = cluster.username), (auth.password = cluster.hash);
    return auth;
  } else {
    return null;
  }
};

exports.getCluster = (clusterId) => {
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
        reject("Invalid cluster credentials");
      } else {
        reject(`${cluster.name} is  not reachable...`);
      }
    } catch (err) {
      console.log("Error occured while getting Cluster info....." + err);
      reject(err);
    }
  });
};

/*
response :  undefined -> cluster not reached network issue or cluster not available
response.status : 200 -> Cluster reachable 
response.status : 403 -> Cluster reachable but Unauthorized
*/

exports.isClusterReachable = (clusterHost, port, username, password) => {
  let auth = {
    user: username || "",
    password: password || "",
  };

  return new Promise((resolve, reject) => {
    request.get(
      {
        url: clusterHost + ":" + port,
        auth: auth,
        timeout: 3000,
      },
      function (error, response, body) {
        if (!error && response.statusCode === 200) {
          resolve({ reached: true, statusCode: 200 });
        } else if (!error && response.statusCode === 401) {
          logger.error(`${clusterHost} - Access denied`);
          resolve({ reached: true, statusCode: 403 });
        } else {
          logger.error(error);
          resolve({ reached: false, statusCode: 503 });
        }
      }
    );
  });
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

exports.getWorkunitsService = async (clusterId) => {
  const cluster = await module.exports.getCluster(clusterId);
  const { hash, username } = cluster;

  const connectionSettings = {
    baseUrl: cluster.thor_host + ":" + cluster.thor_port,
    userID: username ? username : "",
    password: hash ? hash : "",
  };

  return new hpccJSComms.WorkunitsService(connectionSettings);
};

exports.getDFUService = async (clusterId) => {
  const cluster = await module.exports.getCluster(clusterId);
  const clusterAuth = module.exports.getClusterAuth(cluster);

  const connectionSettings = {
    baseUrl: cluster.thor_host + ":" + cluster.thor_port,
    userID: clusterAuth ? clusterAuth.user : "",
    password: clusterAuth ? clusterAuth.password : "",
  };

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
    console.log("create workunit error------------------------------------");
    console.dir(error, { depth: null });
    const customError = new Error("Failed to create new Work Unit.");
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
    console.log("update workunit error------------------------------------");
    console.dir(error, { depth: null });
    const customError = new Error("Failed to update Work Unit.");
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
    console.log("submit workunit error-----------------------------------");
    console.dir(error, { depth: null });
    const customError = new Error("Failed to submit Work Unit.");
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
  }
};

exports.updateWUAction = async (clusterId, WUactionBody) => {
  try {
    const wuService = await module.exports.getWorkunitsService(clusterId);
    const respond = await wuService.WUAction(WUactionBody);
    const result = respond.ActionResults?.WUActionResult?.[0]?.Result;
    if (!result || result !== "Success") throw respond;
    console.dir(respond, { depth: null });
    console.log("------------------------------------------");
    return respond;
  } catch (error) {
    console.log("update workunit action error----------------------------");
    console.dir(error, { depth: null });
    const customError = new Error("Failed to update Work Unit action");
    customError.details = error; // RESPOND WITH EXCEPTIONS CAN BE FOUND HERE.
    throw customError;
  }
};

exports.pullFilesFromGithub = async (jobName = "", clusterId, gitHubFiles) => {
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
      console.log(
        "❌ pullFilesFromGithub: WUCreate error-----------------------------------------"
      );
      console.dir(createRespond, { depth: null });
      throw new Error("Failed to update Work Unit.");
    }
    tasks.WUCreated = true;
    console.log(`✔️  pullFilesFromGithub: WUCreated-  ${wuid}`);

    // CLONING OPERATIONS
    // gitHubFiles = {
    //   selectedProjects // List of selected projects IDS! ['c1bdfedd-4be7-4391-9936-259b040786cd']
    //   selectedRepoId // Id of repo with main file "c1bdfedd-4be7-4391-9936-259b040786cd"
    //   selectedFile:{ // main file data
    //      download_url, git_url, html_url, id, isLeaf, label, name, owner, path, ref, repo, sha, size, type, url, value,
    //    }

    // Create one master folder that is going to hold all cloned repos, name of folder is newly created WUID number;
    masterFolder = path.join(process.cwd(), "..", "gitClones", wuid);
    const dir = await fs.promises.mkdir(masterFolder, { recursive: true });
    console.log("--dir created----------------------------------------");
    console.dir({ dir });
    const git = simpleGit({ baseDir: masterFolder });

    const { selectedProjects } = gitHubFiles;

    //Loop through the reposList(contains GHprojects ids that has all gh project data including tokens) and clone each repo into master folder;
    for (const repoId of selectedProjects) {
      let project = await GHprojects.findOne({ where: { id: repoId } });
      if (!project) throw new Error("Failed to find GitHub project");

      project = project.toJSON();

      if (project.ghToken) project.ghToken = decryptString(project.ghToken);
      if (project.ghUserName)
        project.ghUserName = decryptString(project.ghUserName);

      let { ghLink, ghBranchOrTag, ghUserName, ghToken } = project;

      const ghProjectName = ghLink.split("/")[4];

      const clonePath = path.join(masterFolder, ghProjectName);
      // Add credentials to git request if they are present
      if (ghUserName && ghToken)
        ghLink =
          ghLink.slice(0, 8) +
          ghUserName +
          ":" +
          ghToken +
          "@" +
          ghLink.slice(8);

      console.log(
        `✔️  pullFilesFromGithub: CLONING STARTED-${ghLink}, branch/tag: ${ghBranchOrTag}`
      );
      await git.clone(ghLink, clonePath, {
        "--branch": ghBranchOrTag,
        "--single-branch": true,
      });
      console.log(
        `✔️  pullFilesFromGithub: CLONING FINISHED-${ghLink}, branch/tag: ${ghBranchOrTag}`
      );

      //Update submodules
      try {
        await git
          .cwd({ path: clonePath, root: true })
          .submoduleUpdate(["--init", "--recursive"]);
        console.log(
          `✔️  pullFilesFromGithub: SUBMODULES UPDATED ${ghLink}, branch/tag: ${ghBranchOrTag}`
        );
      } catch (error) {
        console.log(
          "❌  pullFilesFromGithub: git submodule update error----------------------------------------"
        );
        console.dir(error, { depth: null });
      } finally {
        // Switch back to root folder after updating submodules
        await git.cwd({ path: masterFolder, root: true });
      }
    }
    tasks.repoCloned = true;

    //Create a path to main file
    const { repo: ghProjectName, path: filePath } = gitHubFiles.selectedFile;

    const startFilePath = path.join(masterFolder, ghProjectName, filePath);

    let args = ["-E", startFilePath, "-I", masterFolder];
    const archived = await this.createEclArchive(args, masterFolder);

    tasks.archiveCreated = true;
    console.log("✔️  pullFilesFromGithub: Archive Created");
    // console.dir(archived);

    // Update the Workunit with Archive XML
    const updateBody = {
      Wuid: wuid,
      Jobname: jobName,
      QueryText: archived.stdout,
    };
    const updateRespond = await wuService.WUUpdate(updateBody);
    if (!updateRespond.Workunit?.Wuid) {
      // assume that Wuid field is always gonna be in "happy" response
      console.log(
        "❌  pullFilesFromGithub: WUupdate error----------------------------------------"
      );
      console.dir(updateRespond, { depth: null });
      throw new Error("Failed to update Work Unit.");
    }
    tasks.WUupdated = true;
    console.log(`✔️  pullFilesFromGithub: WUupdated-  ${wuid}`);

    // Submit the Workunit to HPCC
    const submitBody = { Wuid: wuid, Cluster: "thor" };
    const submitRespond = await wuService.WUSubmit(submitBody);
    if (submitRespond.Exceptions) {
      console.log(
        "❌  pullFilesFromGithub: WUsubmit error---------------------------------------"
      );
      console.dir(submitRespond, { depth: null });
      throw new Error("Failed to submit Work Unit.");
    }
    tasks.WUsubmitted = true;
    console.log(`✔️  pullFilesFromGithub: WUsubmitted-  ${wuid}`);
  } catch (error) {
    // Error going to have messages related to where in process error happened, it will end up in router.post('/executeJob' catch block.
    try {
      const WUactionBody = {
        Wuids: { Item: [wuid] },
        WUActionType: "SetToFailed",
      };
      const actionRespond = await wuService.WUAction(WUactionBody);
      const result = actionRespond.ActionResults?.WUActionResult?.[0]?.Result;
      if (!result || result !== "Success") {
        console.log(
          "❌  pullFilesFromGithub: WUaction error-------------------------------------"
        );
        console.dir(actionRespond, { depth: null });
        throw actionRespond;
      }
      tasks.WUaction = actionRespond.ActionResults.WUActionResult;
    } catch (error) {
      error.message
        ? (tasks.WUaction = { message: error.message, failedToUpdate: true })
        : (tasks.WUaction = { ...error, failedToUpdate: true });
    }

    tasks.error = error;
    console.log(
      "❌  pullFilesFromGithub: ERROR IN MAIN CATCH------------------------------------"
    );
    console.dir(error, { depth: null });
  } finally {
    // Delete repo;
    const isDeleted = deleteRepo(masterFolder);
    console.log(
      `✔️  pullFilesFromGithub: CLEANUP, REPO DELETED SUCCESSFULLY-  ${masterFolder}`
    );
    tasks.repoDeleted = isDeleted;
    const summary = { wuid, ...tasks };
    return summary;
  }
};

const deleteRepo = (masterFolder) => {
  let isRepoDeleted;
  try {
    fs.rmSync(masterFolder, { recursive: true, maxRetries: 5, force: true });
    isRepoDeleted = true;
  } catch (err) {
    console.log("------------------------------------------");
    console.log(
      `❌  pullFilesFromGithub: Failed to delete a repo ${masterFolder}`
    );
    console.dir(err);
    isRepoDeleted = false;
  }
  return isRepoDeleted;
};

let sortFiles = (files) => {
  return files.sort((a, b) => (a.name > b.name ? 1 : -1));
};

exports.createEclArchive = (args, cwd) => {
  return new Promise((resolve, reject) => {
    const child = cp.spawn("eclcc", args, { cwd: cwd });
    child.on("error", (error) => {
      error.message = "Failed to create ECL Archive.  " + error;
      reject(error);
    });
    let stdOut = "",
      stdErr = "";
    child.stdout.on("data", (data) => {
      stdOut += data.toString();
    });
    child.stderr.on("data", (data) => {
      stdErr += data.toString();
    });
    child.on("close", (_code, _signal) => {
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

exports.getClusterTimezoneOffset = async (clusterId) => {
  console.log("cluster timezone offset running");
  try {
    // Create empty WU, will give wuID
    const wuId = await module.exports.createWorkUnit(clusterId, {
      jobname: `timezone_offset`,
    });

    //code that will run on cluster's ECL
    const code = `IMPORT Std;
                now := Std.Date.LocalTimeZoneOffset();
                OUTPUT(now);`;
    const parentDir = path.join(process.cwd(), "eclDir");
    date = new Date().getTime().toString();
    filename = "timezone" + date + ".ecl";
    const pathToEclFile = path.join(process.cwd(), "eclDir", filename);
    fs.writeFileSync(pathToEclFile, code);
    // update the wu with ecl archive
    const args = ["-E", pathToEclFile, "-I", parentDir];
    const archived = await module.exports.createEclArchive(args, parentDir);
    const updateBody = {
      Wuid: wuId,
      QueryText: archived.stdout,
      Jobname: `timezone_offset`,
    };

    const workUnitService = await module.exports.getWorkunitsService(clusterId);

    //update WU
    await workUnitService.WUUpdate(updateBody);

    //Submit the wu
    const submitBody = {
      Wuid: wuId,
      Cluster: "hthor",
    };

    await workUnitService.WUSubmit(submitBody);

    //check if WU is finished before grabbing the output by checking the state given by WUUpdate
    let stateCheck = await workUnitService.WUUpdate(updateBody);
    let complete = false;

    //continue checking state until it is not compiled or running
    while (!complete) {
      stateCheck = await workUnitService.WUUpdate(updateBody);
      //status' are running, completed, compiled, failed, unknown
      if (
        stateCheck.Workunit.State !== "compiled" &&
        stateCheck.Workunit.State !== "running"
      ) {
        complete = true;
      }
    }

    //if workunit failed or is unknown, throw error message
    if (
      stateCheck.Workunit.State == "failed" ||
      stateCheck.Workunit.State == "unknown"
    ) {
      throw new Error(
        "Work unit to get timezone offset for cluster has failed \n wuId:" +
          wuId
      );
    }

    //grab output
    let result = await module.exports.workUnitOutput({
      wuid: wuId,
      clusterId: clusterId,
    });

    if (!result) {
      throw new Error("Failed to output from work unit for timezone offset");
    }

    //Offset is given in seconds from GMT, divide by 60 to get offset in minutes
    //1/20/23 mfancher - adjusted to minutes to store, floor result to avoid floating point.
    const clusterUtcOffset = Math.floor(result.Result?.Row[0]?.Result_1 / 60);

    //1/20/23 mfancher - add second check to make sure it's not 0 because JS throws error when it's null, undef, or 0 with just ! comparison
    if (!clusterUtcOffset && clusterUtcOffset !== 0) {
      throw new Error(
        "Error reading response from work unit for timezone offset"
      );
    }
    //delete file
    fs.unlinkSync(pathToEclFile);

    // ------------------------------ NEED TO FIGURE OUT HOW TO DELETE
    //delete work unit
    // const wuService = await module.exports.getWorkunitsService(clusterId);
    // let wuids = [wuId];
    // const respond = await wuService.WUAction(Wuids = wuids, WUActionType = );

    // console.log(respond)

    //-------------------------------

    //return result
    return clusterUtcOffset;
  } catch (err) {
    console.log("ERROR ADDING OFFSET----------------------------------------");
    console.log(err);
    console.log("----------------------------------------");
  }
};

//get superfile info
exports.getSuperFile = async (clusterId, fileName) => {
  try {
    const dfuService = await exports.getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        "Error connecting to cluster when getting superfile information"
      );
    }
    //gets superfile, with size and count of subfiles
    let superFileList = await dfuService.DFUQuery({
      FileType: "Superfiles only",
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
      output = "No file found";
      throw new Error("No file found with that name");
    }

    return output;
  } catch (err) {
    console.log(
      "ERROR GETTING SUPERFILE---------------------------------------"
    );
    console.log(err);
    console.log("----------------------------------------");
  }
};

//get all superfiles
exports.getSuperFiles = async (clusterId, fileName) => {
  try {
    const dfuService = await exports.getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        "Error connecting to cluster when getting superfile information"
      );
    }

    //if no filename was passed in, just pass wildcard
    if (fileName) {
      searchName = fileName + "*";
    } else {
      searchName = "*";
    }

    //gets superfile, with size and count of subfiles
    let superFileList = await dfuService.DFUQuery({
      FileType: "Superfiles only",
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
      results.forEach((superFile) => {
        output.push({
          text: superFile.Name,
          value: superFile.Name,
          superOwners: superFile.SuperOwners,
        });
      });
    } else {
      //return no file found
      output = "No file found";
      throw new Error("No file found with that name");
    }
    return output;
  } catch (err) {
    console.log(
      "ERROR GETTING SUPERFILE---------------------------------------"
    );
    console.log(err);
    console.log("----------------------------------------");
  }
};

//get all superfile subfiles
exports.getAllSubFiles = async (clusterId, fileName) => {
  try {
    const dfuService = await exports.getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        "Error connecting to cluster when getting superfile information"
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
        let split = tempFileName.split("::");

        let scope = split.splice(0, split.length - 1).join("::");

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
    console.log("ERROR GETTING SUPERFILE SUBFILES------------------");
    console.log(err);
    console.log("----------------------------------------");
  }
};

//get most recent sub file and sub file count (logical files only)
exports.getRecentSubFile = async (clusterId, fileName) => {
  try {
    let mostRecentSubFile = "";
    let recentDate = new Date("1970-01-01");
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
    console.log("ERROR GETTING MOST RECENT SUBFILE-----------------");
    console.log(err);
    console.log("----------------------------------------");
  }
};

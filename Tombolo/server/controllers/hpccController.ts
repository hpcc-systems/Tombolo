import { Request, Response } from 'express';
import axios from 'axios';
import {
  getCluster,
  getClusterAuth,
  getSuperFiles,
  getSuperFile,
  getWorkunitsService,
  logicalFileDetails,
  getDirectories,
} from '../utils/hpcc-util.js';
import { Cluster } from '../models/index.js';
import { DFUService, WorkunitsService, TopologyService } from '@hpcc-js/comms';
import lodash from 'lodash';

import logger from '../config/logger.js';
import moment from 'moment';
import { getClusterOptions } from '../utils/getClusterOptions.js';
import { sendSuccess, sendError } from '../utils/response.js';

async function fileSearch(req: Request, res: Response) {
  let cluster;
  try {
    cluster = await getCluster(req.body.clusterid);
  } catch (err) {
    logger.error(err);
    return sendError(
      res,
      'Search failed. Please check if the cluster is running.',
      500
    );
  }

  try {
    let results = [];

    let clusterAuth = getClusterAuth(cluster);
    let contentType = req.body.indexSearch ? 'key' : '';
    let dfuService = new DFUService(
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

    return sendSuccess(res, results);
  } catch (err) {
    logger.error('hpcc/read fileSearch: ', err);
    return sendError(res, 'Error occurred during search.', 500);
  }
}

async function superfileSearch(req: Request, res: Response) {
  try {
    await getCluster(req.body.clusterid);
  } catch (err) {
    logger.error('hpcc/read - superfileSearch - Cluster not reachable: ', err);
    return sendError(
      res,
      'Search failed. Please check if the cluster is running.',
      500
    );
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

    let superfile = await getSuperFiles(req.body.clusterid, logicalFileName);

    return sendSuccess(res, superfile);
  } catch (err) {
    logger.error('hpcc/read superfileSearch: ', err);
    return sendError(
      res,
      'Error occurred during search. Please check if the cluster is running.',
      500
    );
  }
}

async function querySearch(req: Request, res: Response) {
  let cluster;
  try {
    cluster = await getCluster(req.body.clusterid);
  } catch (err) {
    logger.error('Cluster not reachable: ' + JSON.stringify(err));
    return sendError(
      res,
      'Search failed. Please check if the cluster is running.',
      500
    );
  }

  try {
    let querySearchAutoComplete = [];
    let clusterAuth = getClusterAuth(cluster);
    let wsWorkunits = new WorkunitsService(
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

    return sendSuccess(res, querySearchAutoComplete);
  } catch (err) {
    logger.error('Error occurred while querying : ' + JSON.stringify(err));
    return sendError(res, 'Search failed. Error occurred while querying.', 500);
  }
}

async function jobSearch(req: Request, res: Response) {
  try {
    const { keyword, clusterId, clusterType } = req.body;
    const wuService = await getWorkunitsService(clusterId);

    //If no * add to start and end
    // If there are one or more astrik leave as they are
    let jobName = keyword.includes('*') ? keyword : `*${keyword}*`;
    const response = await wuService.WUQuery({
      Jobname: jobName,
      Cluster: clusterType,
    });

    let workunitsResult = [];

    if (response.Workunits) {
      const workunitsHash = response.Workunits.ECLWorkunit.reduce((acc, wu) => {
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
      }, {});
      workunitsResult = Object.values(workunitsHash);
    }
    return sendSuccess(res, workunitsResult);
  } catch (error) {
    logger.error('jobsearch error', error);
    return sendError(
      res,
      'Search failed. Please check if the cluster is running.',
      500
    );
  }
}

async function getClustersCtr(req: Request, res: Response) {
  try {
    const clusters = await Cluster.findAll({
      attributes: { exclude: ['hash', 'username', 'metaData'] },
      order: [['createdAt', 'DESC']],
    });

    return sendSuccess(res, clusters);
  } catch (err) {
    logger.error('hpcc/read getClusters: ', err);
    return sendError(res, 'Error occurred while retrieving cluster list', 500);
  }
}

async function getClusterCtr(req: Request, res: Response) {
  try {
    const clusters = await Cluster.findOne({
      where: { id: req.query.cluster_id },
    });
    return sendSuccess(res, clusters);
  } catch (err) {
    logger.error('hpcc/read getCluster: ', err);
    return sendError(res, 'Failed to get cluster', 500);
  }
}

async function getLogicalFileDetails(req: Request, res: Response) {
  try {
    const { fileName, clusterid } = req.query;
    const details = await logicalFileDetails(
      fileName as string,
      clusterid as string
    );
    // Removing unnecessary data before sending to client
    details.DFUFilePartsOnClusters
      ? delete details.DFUFilePartsOnClusters
      : null;
    details.Ecl ? delete details.Ecl : null;
    details.Stat ? delete details.Stat : null;
    return sendSuccess(res, details);
  } catch (error) {
    logger.error('hpcc/read getLogicalFileDetails: ', error);
    return sendError(res, 'Error occurred while getting file details', 500);
  }
}

async function hpccGetData(req: Request, res: Response) {
  try {
    const cluster = await getCluster(req.query.clusterid as string);

    let clusterAuth = getClusterAuth(cluster);
    let wuService = new WorkunitsService(
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
      LogicalName: req.query.fileName as string,
      Cluster: 'mythor',
      Count: 50,
    });

    if (
      (response as any).Result !== undefined &&
      (response as any).Result.Row !== undefined
    ) {
      const rows = (response as any).Result.Row;

      if (rows.length > 0) {
        rows.shift();
        return sendSuccess(res, rows);
      }
    }

    return sendSuccess(res, []);
  } catch (err) {
    logger.error('hpcc/read getData: ', err);
    return sendError(res, 'Error occured while getting file data', 500);
  }
}

async function getFileProfile(req: Request, res: Response) {
  try {
    const cluster = await getCluster(req.query.clusterid as string);
    const response = await axios.get(
      `${cluster.thor_host}:${cluster.thor_port}/WsWorkunits/WUResult.json?LogicalName=${req.query.fileName}.profile`,
      {
        auth: getClusterAuth(cluster) as any as any,
      }
    );

    const result = response.data;
    if (result.Exceptions) {
      return sendSuccess(res, []);
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
        return sendSuccess(res, rows);
      }
    }
    return sendSuccess(res, []);
  } catch (err) {
    logger.error('hpcc/read getFileProfile: ', err);
    return sendError(res, 'Error', 500);
  }
}

async function getFileProfileHtml(req: Request, res: Response) {
  try {
    const cluster = await getCluster(req.query.clusterid as string); //call DFUInfo to get workunit id
    const wuid = req.query.dataProfileWuid as string; //get resource url's from wuinfo

    const response = await axios.post(
      `${cluster.thor_host}:${cluster.thor_port}/WsWorkunits/WUInfo.json`,
      new URLSearchParams({
        Wuid: wuid,
        TruncateEclTo64k: 'true' as any,
        IncludeResourceURLs: 'true' as any,
        IncludeExceptions: 'false' as any,
        IncludeGraphs: 'false' as any,
        IncludeSourceFiles: 'false' as any,
        IncludeResults: 'false' as any,
        IncludeResultsViewNames: 'false' as any,
        IncludeVariables: 'false' as any,
        IncludeTimers: 'false' as any,
        IncludeDebugValues: 'false' as any,
        IncludeApplicationValues: 'false' as any,
        IncludeWorkflows: 'false' as any,
        IncludeXmlSchemas: 'false' as any,
        SuppressResultSchemas: 'true' as any,
      } as any).toString(),
      {
        auth: getClusterAuth(cluster) as any,
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
    return sendSuccess(res, filteredUrl);
  } catch (err) {
    logger.error('hpcc/read getFileProfileHTML: ', err);
    return sendError(res, 'Error', 500);
  }
}

async function getQueryFiles(req: Request, res: Response) {
  try {
    const wuService = await getWorkunitsService(req.query.clusterId as string);
    const response = await wuService.WUQueryDetails({
      QueryId: req.query.hpcc_queryId as string,
      IncludeSuperFiles: true,
      QuerySet: 'roxie',
    });

    return sendSuccess(res, {
      logicalFiles: response?.LogicalFiles?.Item || [],
      superFiles: response?.SuperFiles?.SuperFile || [],
    });
  } catch (err) {
    logger.error('hpcc/read getQueryFiles: ', err);
    return sendError(res, 'Error while fetching query files', 503);
  }
}

async function getDropZones(req: Request, res: Response) {
  try {
    const cluster = await getCluster(req.query.clusterId as string);
    const url = `${cluster.thor_host}:${cluster.thor_port}/WsTopology/TpDropZoneQuery.json`;

    const response = await axios.get(url, {
      auth: getClusterAuth(cluster) as any,
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
      return sendSuccess(res, dropZoneDetails);
    } else {
      return sendSuccess(res, _dropZones);
    }
  } catch (err) {
    logger.error('hpcc/read getDropZones: ', err);
    return sendError(res, 'Error occurred while getting dropzones', 500);
  }
}

async function getDropzoneDirectories(req: Request, res: Response) {
  try {
    const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;
    const directories = await getDirectories({
      clusterId: clusterId as string,
      Netaddr: Netaddr as string,
      Path: Path as string,
      DirectoryOnly: DirectoryOnly === 'true',
    });
    return sendSuccess(res, directories);
  } catch (error) {
    logger.error('hpcc/read dropZoneDirectories: ', error);
    return sendError(res, error.message, 500);
  }
}

async function getDropzoneDirectoryDetails(req: Request, res: Response) {
  const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;
  logger.info('Cluster id etc. ', clusterId, Netaddr, Path, DirectoryOnly);
  try {
    const { clusterId, Netaddr, Path, DirectoryOnly } = req.query;

    const directories = await getDirectories({
      clusterId: clusterId as string,
      Netaddr: Netaddr as string,
      Path: Path as string,
      DirectoryOnly: DirectoryOnly === 'true',
    });
    let fileCount = 0;
    let directoryCount = 0;
    let oldestFile = null;
    const allAssets = [];
    if ((directories as any).FileListResponse?.files) {
      const { PhysicalFileStruct: assets } = (directories as any)
        .FileListResponse.files;
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
            let currentOldestFileModifiedTime = moment(oldestFile.modifiedtime);
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
    return sendSuccess(res, directoryDetails);
  } catch (err) {
    logger.error('hpcc/read dropZoneDirectoryDetails: ', err);
    return sendError(res, err.message, 503);
  }
}

async function dropzoneFileSearch(req: Request, res: Response) {
  try {
    const cluster = await getCluster(req.body.clusterId);
    const response = await axios.post(
      `${cluster.thor_host}:${cluster.thor_port}/FileSpray/DropZoneFileSearch.json`,
      new URLSearchParams({
        DropZoneName: req.body.dropZoneName,
        Server: req.body.server,
        NameFilter: `*${req.body.nameFilter}*`,
        '__dropZoneMachine.label': req.body.server,
        '__dropZoneMachine.value': req.body.server,
        '__dropZoneMachine.selected': 'true' as any,
        rawxml_: 'true' as any,
      } as any).toString(),
      {
        auth: getClusterAuth(cluster) as any,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }
    );

    const result = response.data;
    let files = [];
    if (result?.DropZoneFileSearchResponse?.Files?.PhysicalFileStruct) {
      files = result.DropZoneFileSearchResponse.Files.PhysicalFileStruct;
    }
    return sendSuccess(res, files);
  } catch (err) {
    logger.error('hpcc/read dropZoneFileSearch: ', err);
    return sendError(res, 'Error occurred during dropzone file search', 500);
  }
}

async function getSuperfileDetails(req: Request, res: Response) {
  try {
    const { fileName, clusterid } = req.query;

    const details = await getSuperFile(clusterid, fileName);

    return sendSuccess(res, details);
  } catch (error) {
    logger.error('hpcc/read getSuperFileDetails: ', error);
    return sendError(res, 'Error occurred while getting file details', 500);
  }
}

async function getClusterMetaData(req: Request, res: Response) {
  try {
    const { clusterId } = req.query;
    //Validate cluster Id
    //If cluster id is valid ->      const { clusterId } = req.query;
    //Get cluster details
    let cluster = await getCluster(clusterId as string);
    const { thor_host, thor_port, username, hash, allowSelfSigned } = cluster;
    const clusterDetails = getClusterOptions(
      {
        baseUrl: `${thor_host}:${thor_port}`,
        userID: username || '',
        password: hash || '',
      },
      allowSelfSigned
    );
    const topologyService = new TopologyService(clusterDetails);
    const tpServiceQuery = await topologyService.TpServiceQuery({
      Type: 'ALLSERVICES',
    });
    const tpLogicalClusterQuery = await topologyService.TpLogicalClusterQuery(
      {}
    ); // Active execution engines
    const dropZones = tpServiceQuery.ServiceList?.TpDropZones?.TpDropZone; // Landing zones and their local dir paths
    const clusterMetaData = {
      TpDfuServer: tpServiceQuery.ServiceList,
      tpLogicalCluster:
        tpLogicalClusterQuery.TpLogicalClusters.TpLogicalCluster,
      dropZones,
    };

    return sendSuccess(res, clusterMetaData);
  } catch (err) {
    logger.error('hpcc/read clusterMetaData: ', err);
    return sendError(res, err, 503);
  }
}

export {
  fileSearch,
  superfileSearch,
  querySearch,
  jobSearch,
  getClustersCtr,
  getClusterCtr,
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
};

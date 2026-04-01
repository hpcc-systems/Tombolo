/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from 'axios';
import {
  DFUService,
  FileSprayService,
  EclService,
  WorkunitsService,
} from '@hpcc-js/comms';
import { getCluster } from '@tombolo/core';
import { getClusterOptions } from './getClusterOptions.js';
import logger from '../config/logger.js';
import { ClusterAttributes } from '@tombolo/shared';

// Gets details about the file without modifying anything - just whatever jscomms gives
export async function logicalFileDetails(
  fileName: string,
  clusterId: string
): Promise<any> {
  const dfuService = await getDFUService(clusterId);
  const { FileDetail } = await dfuService.DFUInfo({ Name: fileName });

  if ((FileDetail as any).Exceptions?.Exception) {
    throw (FileDetail as any).Exceptions.Exception[0];
  }
  return FileDetail;
}

async function getIndexColumns(cluster: any, indexName: string): Promise<any> {
  const columns: any = {};
  try {
    const response = await axios.get(
      cluster.thor_host +
        ':' +
        cluster.thor_port +
        '/WsDfu/DFUGetFileMetaData.json?LogicalFileName=' +
        indexName,
      {
        auth: getClusterAuth(cluster),
      }
    );
    const result = response.data;
    if (result.DFUGetFileMetaDataResponse != undefined) {
      const indexColumns =
        result.DFUGetFileMetaDataResponse.DataColumns.DFUDataColumn;
      const nonkeyedColumns = [];
      const keyedColumns = [];
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
  } catch (err) {
    logger.error('error occurred: ' + err);
    return columns;
  }
}

export const indexInfo = (
  clusterId: string,
  indexName: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      getCluster(clusterId).then(function (cluster) {
        const clusterAuth = getClusterAuth(cluster);
        const dfuService = new DFUService(
          getClusterOptions(
            {
              baseUrl: cluster.thor_host + ':' + cluster.thor_port,
              userID: clusterAuth ? clusterAuth.username : '',
              password: clusterAuth ? clusterAuth.password : '',
            },
            cluster.allowSelfSigned
          )
        );
        dfuService.DFUInfo({ Name: indexName }).then(response => {
          if (response.FileDetail) {
            const indexInfo: any = {};
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

export async function getDirectories({
  clusterId,
  Netaddr,
  Path,
  DirectoryOnly,
}: {
  clusterId: string;
  Netaddr: string;
  Path: string;
  DirectoryOnly: boolean;
}): Promise<any[]> {
  const cluster = await getCluster(clusterId);
  const clusterDetails = getClusterOptions(
    {
      baseUrl: cluster.thor_host + ':' + cluster.thor_port,
      userID: cluster.username || '',
      password: cluster.hash || '',
    },
    cluster.allowSelfSigned
  );
  const fileSprayService = new FileSprayService(clusterDetails);

  const fileList = await fileSprayService.FileList({
    DirectoryOnly,
    Netaddr,
    Path,
  });
  return fileList.files?.PhysicalFileStruct || [];
}

export async function executeSprayJob(job: any): Promise<any> {
  // try {
  try {
    const cluster = await getCluster(job.cluster_id);
    const sprayPayload = {
      destGroup: 'mythor',
      DFUServerQueue: 'dfuserver_queue',
      namePrefix: job.sprayedFileScope,
      targetName: job.sprayFileName,
      overwrite: 'on',
      sourceIP: job.sprayDropZone,
      sourcePath: `/var/lib/HPCCSystems/mydropzone/${job.sprayFileName}`,
      destLogicalName: `${job.sprayedFileScope}::${job.sprayFileName}`,
      rawxml_: '1',
      sourceFormat: '1',
      sourceCsvSeparate: ',',
      sourceCsvTerminate: '\n,\r\n',
      sourceCsvQuote: '"',
    };

    // logger.info(sprayPayload);

    const response = await axios.post(
      `${cluster.thor_host}:${cluster.thor_port}/FileSpray/SprayVariable.json`,
      new URLSearchParams(sprayPayload as any).toString(),
      {
        auth: getClusterAuth(cluster),
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }
    );

    return response.data;
  } catch (err) {
    logger.error('ERROR - ', err);
    throw new Error('Error occurred during dropzone file search');
  }
}

export function queryInfo(clusterId: string, queryName: string): Promise<any> {
  const resultObj: any = { basic: {} },
    requestObj = [],
    responseObj = [];
  try {
    return new Promise((resolve, reject) => {
      getCluster(clusterId).then(function (cluster) {
        const clusterAuth = getClusterAuth(cluster);
        const eclService = new EclService(
          getClusterOptions(
            {
              baseUrl: cluster.roxie_host + ':' + cluster.roxie_port,
              userID: clusterAuth ? clusterAuth.username : '',
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
                  const firstKey = Object.keys(response)[0];
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
    logger.error('err', err);
  }
}

export async function getJobInfo(
  clusterId: string,
  jobWuid: string,
  jobType: string
): Promise<any> {
  try {
    const wuService = await getWorkunitsService(clusterId);
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

      wuInfo.Workunit?.Results?.ECLResult?.forEach((file: any) => {
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
}

export async function workunitInfo(
  wuid: string,
  clusterId: string
): Promise<any> {
  const wuService = await getWorkunitsService(clusterId);
  return await wuService.WUInfo({
    Wuid: wuid,
    IncludeExceptions: true,
    IncludeSourceFiles: true,
    IncludeResults: true,
    IncludeTotalClusterTime: true,
    IncludeResultsViewNames: true,
  });
}

export function getClusterAuth(
  cluster: ClusterAttributes
): { username: string; password: string } | null {
  if (cluster.username && cluster.hash) {
    return { username: cluster.username, password: cluster.hash };
  } else {
    return null;
  }
}

export async function getWorkunitsService(
  clusterId: string
): Promise<WorkunitsService> {
  const cluster = await getCluster(clusterId);
  const { hash, username, allowSelfSigned, thor_host, thor_port } = cluster;

  const connectionSettings = getClusterOptions(
    {
      baseUrl: thor_host + ':' + thor_port,
      userID: username ? username : '',
      password: hash ? hash : '',
    },
    allowSelfSigned
  );

  return new WorkunitsService(connectionSettings);
}

export async function getDFUService(clusterId: string): Promise<DFUService> {
  const cluster = await getCluster(clusterId);
  const clusterAuth = getClusterAuth(cluster);

  const connectionSettings = getClusterOptions(
    {
      baseUrl: cluster.thor_host + ':' + cluster.thor_port,
      userID: clusterAuth ? clusterAuth.username : '',
      password: clusterAuth ? clusterAuth.password : '',
    },
    cluster.allowSelfSigned
  );

  return new DFUService(connectionSettings);
}

const sortFiles = files => {
  return files.sort((a, b) => (a.name > b.name ? 1 : -1));
};

type GetSuperFileResponse = {
  cluster_id: string;
  superfile_name: string;
  size: number;
  subfiles: number;
  lastCheck: number;
  modified: number;
};

export async function getSuperFile(
  clusterId: string,
  fileName: string
): Promise<GetSuperFileResponse> {
  try {
    const dfuService = await getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        'Error connecting to cluster when getting superfile information'
      );
    }
    //gets superfile, with size and count of subfiles
    const superFileList = await dfuService.DFUQuery({
      FileType: 'Superfiles only',
      LogicalName: fileName,
    });

    //output
    let output;
    //if one is found, build returns
    if (superFileList.DFULogicalFiles.DFULogicalFile[0]) {
      //get number of sub files
      const numSubFiles =
        superFileList.DFULogicalFiles.DFULogicalFile[0].NumOfSubfiles;

      //dfuService.SuperfileList gets the names of all the subfiles to iterate through, which dfuquery above does not
      const superFile = await dfuService.SuperfileList({
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

      const date = Date.now();

      const modifiedDate = new Date(
        superFileList.DFULogicalFiles.DFULogicalFile[0].Modified
      ).getTime();

      //create new superfile monitoring
      const newSuperFileMonitoring = {
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
      throw new Error('No file found with that name');
    }

    return output;
  } catch (err) {
    logger.error('hpcc-util - getSuperFile: ', err);
  }
}

type GetSuperFilesReponse = {
  text: string;
  value: string;
  superOwners: string;
};
//get all superfiles
export async function getSuperFiles(
  clusterId: string,
  fileName: string
): Promise<GetSuperFilesReponse[]> {
  try {
    const dfuService = await getDFUService(clusterId);
    if (!dfuService) {
      throw new Error(
        'Error connecting to cluster when getting superfile information'
      );
    }

    //if no filename was passed in, just pass wildcard
    let searchName = '*';
    if (fileName) {
      searchName = fileName + '*';
    }

    //gets superfile, with size and count of subfiles
    const superFileList = await dfuService.DFUQuery({
      FileType: 'Superfiles only',
      LogicalName: searchName,
      FirstN: 100000000, //without this it will only grab the first 100
    });

    //build output
    const output: GetSuperFilesReponse[] = [];
    if (
      superFileList.DFULogicalFiles &&
      superFileList.DFULogicalFiles.DFULogicalFile.length > 0
    ) {
      const results = superFileList.DFULogicalFiles.DFULogicalFile;
      results.forEach(superFile => {
        output.push({
          text: superFile.Name,
          value: superFile.Name,
          superOwners: superFile.SuperOwners,
        });
      });
    } else {
      throw new Error('No file found with that name');
    }
    return output;
  } catch (err) {
    logger.error('hpcc-util - getSuperFiles: ', err);
  }
}

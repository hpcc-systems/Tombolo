import { apiClient } from '@/services/api';

const hpccService = {
  fileSearch: async ({ clusterid, keyword, fileNamePattern, indexSearch = false }) => {
    const response = await apiClient.post('/hpcc/read/filesearch', {
      clusterid,
      keyword,
      fileNamePattern,
      indexSearch,
    });
    return response.data;
  },

  superfileSearch: async ({ clusterid, keyword, fileNamePattern }) => {
    const response = await apiClient.post('/hpcc/read/superfilesearch', {
      clusterid,
      keyword,
      fileNamePattern,
    });
    return response.data;
  },

  querySearch: async ({ clusterid, keyword }) => {
    const response = await apiClient.post('/hpcc/read/querysearch', {
      clusterid,
      keyword,
    });
    return response.data;
  },

  jobSearch: async ({ keyword, clusterId, clusterType }) => {
    const response = await apiClient.post('/hpcc/read/jobsearch', {
      keyword,
      clusterId,
      clusterType,
    });
    return response.data;
  },

  getClusters: async () => {
    const response = await apiClient.get('/hpcc/read/getClusters');
    return response.data;
  },

  getCluster: async (clusterId) => {
    const response = await apiClient.get('/hpcc/read/getCluster', {
      params: { cluster_id: clusterId },
    });
    return response.data;
  },

  getClusterMetadata: async (clusterId) => {
    const response = await apiClient.get('/hpcc/read/clusterMetaData', {
      params: { clusterId },
    });
    return response.data;
  },

  getFileInfo: async ({ applicationId, fileName, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getFileInfo', {
      params: { applicationId, fileName, clusterid },
    });
    return response.data;
  },

  getLogicalFileDetails: async ({ fileName, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getLogicalFileDetails', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getData: async ({ fileName, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getData', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getFileProfile: async ({ fileName, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getFileProfile', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getFileProfileHTML: async ({ dataProfileWuid, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getFileProfileHTML', {
      params: { dataProfileWuid, clusterid },
    });
    return response.data;
  },

  getSuperFileDetails: async ({ fileName, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getSuperFileDetails', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getIndexInfo: async ({ applicationId, indexName, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getIndexInfo', {
      params: { applicationId, indexName, clusterid },
    });
    return response.data;
  },

  getQueryInfo: async ({ applicationId, queryName, clusterid }) => {
    const response = await apiClient.get('/hpcc/read/getQueryInfo', {
      params: { applicationId, queryName, clusterid },
    });
    return response.data;
  },

  getQueryFiles: async ({ clusterId, hpcc_queryId }) => {
    const response = await apiClient.get('/hpcc/read/getQueryFiles', {
      params: { clusterId, hpcc_queryId },
    });
    return response.data;
  },

  getJobInfo: async ({ applicationId, jobName, clusterid, jobWuid, jobType }) => {
    const response = await apiClient.get('/hpcc/read/getJobInfo', {
      params: { applicationId, jobName, clusterid, jobWuid, jobType },
    });
    return response.data;
  },

  getDropZones: async ({ clusterId, purpose }) => {
    const response = await apiClient.get('/hpcc/read/getDropZones', {
      params: { clusterId, for: purpose },
    });
    return response.data;
  },

  getDropZoneDirectories: async ({ clusterId, Netaddr, Path, DirectoryOnly }) => {
    const response = await apiClient.get('/hpcc/read/dropZoneDirectories', {
      params: { clusterId, Netaddr, Path, DirectoryOnly },
    });
    return response.data;
  },

  getDropZoneDirectoryDetails: async ({ clusterId, Netaddr, Path, DirectoryOnly }) => {
    const response = await apiClient.get('/hpcc/read/dropZoneDirectoryDetails', {
      params: { clusterId, Netaddr, Path, DirectoryOnly },
    });
    return response.data;
  },

  dropzoneFileSearch: async ({ clusterId, dropZoneName, server, nameFilter }) => {
    const response = await apiClient.post('/hpcc/read/dropzoneFileSearch', {
      clusterId,
      dropZoneName,
      server,
      nameFilter,
    });
    return response.data;
  },

  executeSprayJob: async (jobId) => {
    const response = await apiClient.post('/hpcc/read/executeSprayJob', {
      jobId,
    });
    return response.data;
  },
};

export default hpccService;

import { apiClient } from '@/services/api';

const hpccService = {
  fileSearch: async ({
    clusterid,
    keyword,
    fileNamePattern,
    indexSearch = false,
  }: {
    clusterid: string;
    keyword: string;
    fileNamePattern?: string;
    indexSearch?: boolean;
  }): Promise<any> => {
    const response = await apiClient.post('/hpcc/read/filesearch', {
      clusterid,
      keyword,
      fileNamePattern,
      indexSearch,
    });
    return response.data;
  },

  superfileSearch: async ({
    clusterid,
    keyword,
    fileNamePattern,
  }: {
    clusterid: string;
    keyword: string;
    fileNamePattern?: string;
  }): Promise<any> => {
    const response = await apiClient.post('/hpcc/read/superfilesearch', {
      clusterid,
      keyword,
      fileNamePattern,
    });
    return response.data;
  },

  querySearch: async ({ clusterid, keyword }: { clusterid: string; keyword: string }): Promise<any> => {
    const response = await apiClient.post('/hpcc/read/querysearch', {
      clusterid,
      keyword,
    });
    return response.data;
  },

  jobSearch: async ({
    keyword,
    clusterId,
    clusterType,
  }: {
    keyword: string;
    clusterId?: string;
    clusterType?: string;
  }): Promise<any> => {
    const response = await apiClient.post('/hpcc/read/jobsearch', {
      keyword,
      clusterId,
      clusterType,
    });
    return response.data;
  },

  getClusters: async (): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getClusters');
    return response.data;
  },

  getCluster: async (clusterId: string): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getCluster', {
      params: { cluster_id: clusterId },
    });
    return response.data;
  },

  getClusterMetadata: async (clusterId: string): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/clusterMetaData', {
      params: { clusterId },
    });
    return response.data;
  },

  getFileInfo: async ({
    applicationId,
    fileName,
    clusterid,
  }: {
    applicationId?: string;
    fileName: string;
    clusterid: string;
  }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getFileInfo', {
      params: { applicationId, fileName, clusterid },
    });
    return response.data;
  },

  getLogicalFileDetails: async ({ fileName, clusterid }: { fileName: string; clusterid: string }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getLogicalFileDetails', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getData: async ({ fileName, clusterid }: { fileName: string; clusterid: string }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getData', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getFileProfile: async ({ fileName, clusterid }: { fileName: string; clusterid: string }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getFileProfile', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getFileProfileHTML: async ({
    dataProfileWuid,
    clusterid,
  }: {
    dataProfileWuid: string;
    clusterid: string;
  }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getFileProfileHTML', {
      params: { dataProfileWuid, clusterid },
    });
    return response.data;
  },

  getSuperFileDetails: async ({ fileName, clusterid }: { fileName: string; clusterid: string }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getSuperFileDetails', {
      params: { fileName, clusterid },
    });
    return response.data;
  },

  getIndexInfo: async ({
    applicationId,
    indexName,
    clusterid,
  }: {
    applicationId?: string;
    indexName: string;
    clusterid: string;
  }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getIndexInfo', {
      params: { applicationId, indexName, clusterid },
    });
    return response.data;
  },

  getQueryInfo: async ({
    applicationId,
    queryName,
    clusterid,
  }: {
    applicationId?: string;
    queryName: string;
    clusterid: string;
  }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getQueryInfo', {
      params: { applicationId, queryName, clusterid },
    });
    return response.data;
  },

  getQueryFiles: async ({ clusterId, hpcc_queryId }: { clusterId: string; hpcc_queryId: string }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getQueryFiles', {
      params: { clusterId, hpcc_queryId },
    });
    return response.data;
  },

  getJobInfo: async ({
    applicationId,
    jobName,
    clusterid,
    jobWuid,
    jobType,
  }: {
    applicationId?: string;
    jobName?: string;
    clusterid?: string;
    jobWuid?: string;
    jobType?: string;
  }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getJobInfo', {
      params: { applicationId, jobName, clusterid, jobWuid, jobType },
    });
    return response.data;
  },

  getDropZones: async ({ clusterId, purpose }: { clusterId: string; purpose?: string }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/getDropZones', {
      params: { clusterId, for: purpose },
    });
    return response.data;
  },

  getDropZoneDirectories: async ({
    clusterId,
    Netaddr,
    Path,
    DirectoryOnly,
  }: {
    clusterId: string;
    Netaddr?: string;
    Path?: string;
    DirectoryOnly?: boolean;
  }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/dropZoneDirectories', {
      params: { clusterId, Netaddr, Path, DirectoryOnly },
    });
    return response.data;
  },

  getDropZoneDirectoryDetails: async ({
    clusterId,
    Netaddr,
    Path,
    DirectoryOnly,
  }: {
    clusterId: string;
    Netaddr?: string;
    Path?: string;
    DirectoryOnly?: boolean;
  }): Promise<any> => {
    const response = await apiClient.get('/hpcc/read/dropZoneDirectoryDetails', {
      params: { clusterId, Netaddr, Path, DirectoryOnly },
    });
    return response.data;
  },

  dropzoneFileSearch: async ({
    clusterId,
    dropZoneName,
    server,
    nameFilter,
  }: {
    clusterId: string;
    dropZoneName?: string;
    server?: string;
    nameFilter?: string;
  }): Promise<any> => {
    const response = await apiClient.post('/hpcc/read/dropzoneFileSearch', {
      clusterId,
      dropZoneName,
      server,
      nameFilter,
    });
    return response.data;
  },

  executeSprayJob: async (jobId: string): Promise<any> => {
    const response = await apiClient.post('/hpcc/read/executeSprayJob', {
      jobId,
    });
    return response.data;
  },
};

export default hpccService;

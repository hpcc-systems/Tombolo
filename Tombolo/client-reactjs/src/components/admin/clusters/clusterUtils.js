/* eslint-disable prettier/prettier */
import { authHeader } from '../../common/AuthHeader.js';

// Get all clusters
export const getAllClusters = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/cluster`, payload);
  if (!response.ok) {
    throw new Error('Failed to fetch clusters');
  }

  const responseJson = await response.json();
  return responseJson.data;
};

// Delete a cluster
export const deleteCluster = async (id) => {
  const payload = {
    method: 'DELETE',
    headers: authHeader(),
  };

  const response = await fetch(`/api/cluster/${id}`, payload);
  if (!response.ok) {
    throw new Error('Failed to delete cluster');
  }

  return true;
};

// Get cluster white list
export const getClusterWhiteList = async () => {
  const payload = {
    method: 'GET',
    headers: authHeader(),
  };

  const response = await fetch(`/api/cluster/whiteList`, payload);
  if (!response.ok) {
    throw new Error('Failed to fetch cluster white list');
  }

  const responseJson = await response.json();
  return responseJson.data;
};

//Ping a cluster
export const pingCluster = async (clusterInfo) => {
    const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(clusterInfo),
    };
    
    const response = await fetch(`/api/cluster/ping`, payload);

    if(response.status !== 200 && response.status !== 401) {
        throw new Error('Failed to establish connection with cluster');
    }

    return response.status;
};

//Add cluster
export const addCluster = async (clusterInfo) => {
    const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(clusterInfo),
    };

    const response = await fetch(`/api/cluster`, payload);

    if(!response.ok) {
        throw new Error('Failed to add cluster');
    }

    const responseJson = await response.json();
    return responseJson.data;
};

// update cluster
export const updateCluster = async ({id, clusterInfo}) => {
    const payload = {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify(clusterInfo),
    };

    const response = await fetch(`/api/cluster/${id}`, payload);

    if(!response.ok) {
        throw new Error('Failed to update cluster');
    }

    const responseJson = await response.json();
    return responseJson.data;
};

// Get instance name /api/config/instanceName
export const getConfigurationDetails = async () => {
    const payload = {
        method: 'GET',
        headers: authHeader(),
    };

    const response = await fetch(`/api/configurations/instanceDetails`, payload);

    if(!response.ok) {
        throw new Error('Failed to fetch instance name');
    }

    const responseJson = await response.json();
    return responseJson.data; // {instanceName: 'Tombolo', environment: 'production'}
};



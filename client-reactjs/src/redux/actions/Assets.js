import { Constants } from '../../components/common/Constants';

export const assetsActions = {
  assetSelected,
  newAsset,
  searchAsset,
  assetInGroupSelected,
  clusterSelected,
  assetSaved
};

function assetSelected(id, applicationId, title) {
  return dispatch => {
    dispatch(request({ id, applicationId, title }));
  };
  function request(selectedAsset) {
    return {
      type: Constants.ASSET_SELECTED,
      selectedAsset
    }
  }
}

function newAsset(applicationId, groupId) {
  const isNew = true;
  return dispatch => {
    dispatch(request({ applicationId, groupId, isNew }));
  };
  function request(newAsset) {
    return {
      type: Constants.NEW_ASSET,
      newAsset
    }
  }
}

function searchAsset(assetTypeFilter, keywords) {
  return dispatch => {
    dispatch(request({ assetTypeFilter, keywords }));
  };
  function request(searchParams) {
    return {
      type: Constants.SEARCH_ASSET,
      searchParams
    }
  }
}

function assetInGroupSelected(groupId) {
  return dispatch => {
    dispatch(request(groupId));
  };
  function request(groupId) {
    return {
      type: Constants.ASSET_IN_GROUP_SELECTED,
      groupId
    }
  }
}

function clusterSelected(clusterId) {
  return dispatch => {
    dispatch(request(clusterId));
  };
  function request(clusterId) {
    return {
      type: Constants.CLUSTER_SELECTED,
      clusterId
    }
  }
}

function assetSaved(saveResponse) {
  return dispatch => {
    dispatch(request(saveResponse));
  };
  function request(saveResponse) {
    return {
      type: Constants.ASSET_SAVED,
      saveResponse
    }
  }
}
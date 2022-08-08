import { Constants } from '../../components/common/Constants';

export const assetsActions = {
  assetSelected,
  newAsset,
  searchAsset,
  assetInGroupSelected,
  clusterSelected,
};

function assetSelected(id, applicationId, title) {
  return {
    type: Constants.ASSET_SELECTED,
    selectedAsset: { id, applicationId, title },
  };
}

function newAsset(applicationId, groupId) {
  return {
    type: Constants.NEW_ASSET,
    newAsset: { applicationId, groupId, isNew: true },
  };
}

function searchAsset(assetTypeFilter, keywords) {
  return {
    type: Constants.SEARCH_ASSET,
    searchParams: { assetTypeFilter, keywords },
  };
}

function assetInGroupSelected(groupId) {
  return {
    type: Constants.ASSET_IN_GROUP_SELECTED,
    groupId,
  };
}

function clusterSelected(clusterId) {
  return {
    type: Constants.CLUSTER_SELECTED,
    clusterId,
  };
}

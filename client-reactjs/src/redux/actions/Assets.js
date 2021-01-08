import { Constants } from '../../components/common/Constants';

export const assetsActions = {
  assetSelected,
  newAsset,
  searchAsset
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
import { Constants } from '../../components/common/Constants';

export const assetsActions = {
  assetSelected
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
import { Constants } from '../../components/common/Constants';

const initialState = {id:'', applicationId:'', title:''};

export function assetReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.ASSET_SELECTED:
      return {
        selectedAsset: action.selectedAsset
      };
    case Constants.NEW_ASSET:
      return {
        newAsset: action.newAsset
      };
    default:
      return state
  }
}
import { Constants } from '../../components/common/Constants';

const initialState = {
  selectedAsset: { id: '', applicationId: '', title: '' },
  newAsset: { groupId: '', applicationId: '', isNew: false },
  searchParams: { assetTypeFilter: '', keywords: '' },
  assetInGroupId: '',
  clusterId: '',
};

export function assetReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.ASSET_SELECTED:
      return {
        ...state,
        selectedAsset: {
          id: action.selectedAsset.id,
          applicationId: action.selectedAsset.applicationId,
          title: action.selectedAsset.title,
        },
        newAsset: {
          groupId: '',
          applicationId: '',
          isNew: false,
        },
      };
    case Constants.NEW_ASSET:
      return {
        ...state,
        selectedAsset: {
          id: '',
          applicationId: '',
          title: '',
          isNew: true,
        },
        newAsset: {
          groupId: action.newAsset.groupId,
          applicationId: action.newAsset.applicationId,
          isNew: action.newAsset.isNew,
        },
      };
    case Constants.SEARCH_ASSET:
      return {
        ...state,
        searchParams: action.searchParams,
      };
    case Constants.ASSET_IN_GROUP_SELECTED:
      return {
        ...state,
        assetInGroupId: action.groupId,
      };
    case Constants.CLUSTER_SELECTED:
      return {
        ...state,
        clusterId: action.clusterId,
      };
    case Constants.ASSET_SAVED:
      return {
        ...state,
        saveResponse: action.saveResponse,
      };
    default:
      return state;
  }
}

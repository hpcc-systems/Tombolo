import { Constants } from '../../components/common/Constants';

const initialState = {
  selectedAsset:{id:'', applicationId:'', title:''},
  newAsset:{groupId:'', applicationId:'', isNew:false},
  searchParams:{assetTypeFilter:'', keywords:''}
};

export function assetReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.ASSET_SELECTED:
      return {
        ...state,
        selectedAsset: {
          id: action.selectedAsset.id,
          applicationId: action.selectedAsset.applicationId,
          title: action.selectedAsset.title
        },
        newAsset: {
          groupId: '',
          applicationId: '',
          isNew: false
        }
      };
    case Constants.NEW_ASSET:
      return {
        ...state,
        selectedAsset: {
          id: action.newAsset.id,
          applicationId: action.newAsset.applicationId,
          title: action.newAsset.title,
          isNew: true
        },
        newAsset: {
          groupId: '',
          applicationId: '',
          isNew: true
        }
      };
    case Constants.SEARCH_ASSET:
      return {
        ...state,
        searchParams: action.searchParams
      };
    default:
      return state
  }
}
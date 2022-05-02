import { Constants } from '../../components/common/Constants';

const initialState = {
  error:"",
  loading: false,
  tree : [],
  dataList:[],
  expandedKeys:['0-0'],
  selectedKeys:{id:"", key:"0-0"}
};

export function groupsReducer(state = initialState, action) {
  switch (action.type) {
      case Constants.GROUPS_EXPANDED:
        return { ...state, expandedKeys: action.payload};
      case Constants.SELECT_GROUP:
        return {...state,  selectedKeys: action.payload }
      case Constants.FETCH_GROUPS_TREE:
        return { ...state, loading: true, error: ''};
      case Constants.FETCH_GROUPS_TREE_SUCCESS:
          return { ...state, loading: false, tree : action.payload.tree, dataList: action.payload.dataList };
      case Constants.FETCH_GROUPS_TREE_ERROR:
        return { ...state, loading: false, error: action.payload };
      case Constants.EMPTY_GROUPS_TREE:{
        return {...state, tree : []}
      }

    default:
      return state
  }
}
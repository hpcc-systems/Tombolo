import { Constants } from '../../components/common/Constants';

const initialState = {
  expandedKeys:['0-0'],
  selectedKeys:{id:"", key:"0-0"}
};

export function groupsReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.GROUPS_EXPANDED:
      return {
        ...state,
        expandedKeys: action.keys.expandedKeys,
        selectedKeys: {id: action.keys.selectedKeys.id, key:action.keys.selectedKeys.key}
      };
    default:
      return state
  }
}
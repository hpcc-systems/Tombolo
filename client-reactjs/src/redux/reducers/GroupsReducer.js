import { Constants } from '../../components/common/Constants';

const initialState = {};

export function groupsReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.GROUPS_EXPANDED:
      return {
        keys: action.keys
      };
    default:
      return state
  }
}
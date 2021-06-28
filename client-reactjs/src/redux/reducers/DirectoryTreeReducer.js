import { Constants } from '../../components/common/Constants';

const initialState = []

export function directoryTreeReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.UPDATE_TREE:
      return {
        ...state, tree : action.payload
      };
  
    default:
      return state
  }
}
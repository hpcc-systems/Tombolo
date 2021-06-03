import { Constants } from '../../components/common/Constants';

const initialState = {
 groupMoved: ''
};

export function groupsMoveReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.MOVE_GROUP:
      return {
        ...state,
      groupMoved : action.payload
      };
    default:
      return state
  }
}
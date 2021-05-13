import { Constants } from '../../components/common/Constants';

const initialState = {
 groupMoved: ''
};

export function groupsMoveReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.MOVE_GROUP:
        console.log("<<<< Move group dispatched ", action.type, "<<<<", action.payload)

      return {
        ...state,
      groupMoved : action.payload
      };
    default:
      return state
  }
}
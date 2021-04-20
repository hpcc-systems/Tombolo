import { Constants } from '../../components/common/Constants';

const initialState = {
  editMode: false
};

export function viewOnlyModeReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.ENABLE_EDIT:
      return {
        ...state,
      editMode : action.payload
      };
    default:
      return state
  }
}
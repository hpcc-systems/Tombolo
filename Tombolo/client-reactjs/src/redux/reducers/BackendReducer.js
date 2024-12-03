import { Constants } from '../../components/common/Constants';

// Initial state
const initialState = {
  isConnected: false,
  statusRetrieved: false,
  ownerExists: false,
  ownerRetrieved: false,
};

// Backend reducer
export function backendReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.SET_BACKEND_STATUS:
      return {
        ...state,
        isConnected: action.payload,
        statusRetrieved: true,
      };
    case Constants.SET_USER_STATUS:
      return {
        ...state,
        ownerExists: action.payload,
        ownerRetrieved: true,
      };
    default:
      return state;
  }
}

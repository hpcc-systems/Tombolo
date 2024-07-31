import { Constants } from '../../components/common/Constants';

// Initial state
const initialState = {
  isConnected: false,
  statusRetrieved: false,
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
    default:
      return state;
  }
}

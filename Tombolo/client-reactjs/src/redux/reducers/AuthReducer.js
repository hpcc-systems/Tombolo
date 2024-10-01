import { Constants } from '../../components/common/Constants';

const initialState = {
  isAuthenticated: false,
  token: null,
  refreshToken: null,
  user: null, // Add user object
};

export function authenticationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user, // Set user object
      };
    case Constants.LOGIN_FAILED:
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        user: null, // Reset user object
      };
    case Constants.LOGOUT_SUCCESS:
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        user: null, // Reset user object
      };
    case Constants.LOGOUT_FAILED:
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user, // Set user object
      };
    default:
      return state;
  }
}

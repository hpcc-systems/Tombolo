import { Constants } from '../../components/common/Constants';

const initialState = {
  isAuthenticated: false,
  token: null,
  roles: [],
  firstName: '',
  lastName: '',
  id: '',
};

export function authenticationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        roles: action.payload.roles,
        applications: action.payload.applications,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        id: action.payload.id,
      };
    case Constants.LOGIN_FAILED:
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        roles: [],
        applications: [],
        user: null, // Reset user object
        firstName: '',
        lastName: '',
        id: '',
      };
    case Constants.LOGOUT_SUCCESS:
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        roles: [],
        applications: [],
        user: null, // Reset user object
        firstName: '',
        lastName: '',
        id: '',
      };
    case Constants.LOGOUT_FAILED:
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        roles: action.payload.roles,
        applications: action.payload.applications,
        user: action.payload.user, // Set user object
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        id: action.payload.id,
      };
    default:
      return state;
  }
}

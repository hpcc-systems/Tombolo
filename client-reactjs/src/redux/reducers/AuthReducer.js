import { Constants } from '../../components/common/Constants';

let user = {};
const initialState = user ? { loggedIn: true, user } : {};

export function authenticationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.LOGIN_REQUEST:
      return {
        loggingIn: true,
        user: action.user
      };
    case Constants.LOGIN_SUCCESS:
      return {
        loggedIn: true,
        user: action.user
      };
    case Constants.LOGIN_FAILURE:
      return {
        loginFailed: true,
        loggedIn: false
      };
    case Constants.LOGOUT:
      return {
        loggedIn: false,
        user: ''
      };
    case Constants.VALIDATE_TOKEN:      
      return {
        loggedIn: true,
        user: action.user
      };
    case Constants.INVALID_TOKEN:
      return {
        loggedIn: false,
        user: action.user
      };  
    default:
      return state
  }
}
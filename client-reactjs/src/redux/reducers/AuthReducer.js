import { Constants } from '../../components/common/Constants';

let user = {}, userRegistrationError = [];
const initialState = user ? { loggedIn: false, loginFailed:false, user, userRegistrationSuccess: false, newUserRegistering: false, userRegistrationError } : {};

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
    case Constants.REGISTER_USER_REQUEST:      
      return {
        newUserRegistering: true,
        userRegistrationSuccess: undefined
      };    
    case Constants.REGISTER_USER_SUCCESS:      
      return {
        newUserRegistering: false,
        userRegistrationSuccess: true,
        userRegistrationError: [],
        status: action.status
      };    

    case Constants.REGISTER_USER_FAILED:      
      return {
        newUserRegistering: true,
        userRegistrationSuccess: false,
        userRegistrationError: action.error
      };            
      
    default:
      return state
  }
}
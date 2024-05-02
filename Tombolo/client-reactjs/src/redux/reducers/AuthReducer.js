import { Constants } from '../../components/common/Constants';

const initialState = {
  user: {},
  error: '',
  loggedIn: false,
};

export function authenticationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.LOGIN_SUCCESS:
      return { error: '', loggedIn: true, user: action.payload };
    case Constants.VALIDATE_TOKEN:
      return { error: '', loggedIn: true, user: action.payload };
    case Constants.INVALID_TOKEN:
      return { error: action.payload, loggedIn: true, user: {} };
    case Constants.LOGOUT:
      return { ...initialState };
    default:
      return state;
  }
}

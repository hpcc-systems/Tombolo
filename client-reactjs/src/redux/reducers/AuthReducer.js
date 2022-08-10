import { Constants } from '../../components/common/Constants';

const initialState = {
  user: {},
  loggedIn: false,
  login: { loading: false, success: false, error: '' },
  register: { loading: false, success: false, error: '' },
};

export function authenticationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.LOGIN_REQUEST:
      return { ...state, login: { loading: true, error: '', success: false } };
    case Constants.LOGIN_SUCCESS:
      return { ...state, user: action.payload, loggedIn: true, login: { loading: false, error: '', success: true } };
    case Constants.LOGIN_FAILURE:
      return { ...state, user: {}, login: { loading: false, error: action.payload, success: false } };
    case Constants.RESET_LOGIN:
      return { ...state, login: { ...initialState.login } };

    case Constants.REGISTER_USER_REQUEST:
      return { ...state, register: { loading: true, error: '', success: false } };
    case Constants.REGISTER_USER_SUCCESS:
      return { ...state, register: { loading: false, error: '', success: true } };
    case Constants.REGISTER_USER_FAILED:
      return { ...state, register: { loading: false, error: action.payload, success: false } };
    case Constants.RESET_REGISTER:
      return { ...state, register: { ...initialState.register } };

    case Constants.VALIDATE_TOKEN:
      return { ...state, loggedIn: true, user: action.payload };
    case Constants.INVALID_TOKEN:
      return { ...initialState, login: { ...initialState.login, error: action.payload } };
    case Constants.LOGOUT:
      return { ...initialState };

    default:
      return state;
  }
}

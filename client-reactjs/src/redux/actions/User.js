import { authHeader } from '../../components/common/AuthHeader.js';
import { Constants } from '../../components/common/Constants';
var jwtDecode = require('jwt-decode');

export const userActions = {
  login,
  logout,
  validateToken,
  register,
  resetLogin,
  resetRegister,
};

function login({ username, password }) {
  return async (dispatch) => {
    try {
      dispatch({ type: Constants.LOGIN_REQUEST });

      const payload = {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      };

      const response = await fetch('/api/user/authenticate', payload);
      const data = await response.json();

      if (!response.ok) {
        let message = data?.message || data?.errors || response.statusText;
        if (Array.isArray(message)) message.join(', ');
        throw new Error(message);
      } else {
        const decoded = jwtDecode(data.accessToken);
        const user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          token: data.accessToken,
          username: decoded.username,
          lastName: decoded.lastName,
          firstName: decoded.firstName,
          organization: decoded.organization,
          permissions: decoded.role[0].name,
        };
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: Constants.LOGIN_SUCCESS, payload: user });
      }
    } catch (error) {
      console.log('login fetch error', error);
      dispatch({ type: Constants.LOGIN_FAILURE, payload: error.message });
    }
  };
}

function register(user) {
  return async (dispatch) => {
    try {
      dispatch({ type: Constants.REGISTER_USER_REQUEST });

      const payload = {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          password: user.password,
          confirmPassword: user.confirmPassword,
          role: 'Creator',
        }),
      };

      const response = await fetch('/api/user/registerUser', payload);
      const data = await response.json();

      if (!response.ok) {
        let message = data?.message || data?.errors || response.statusText;
        if (Array.isArray(message)) message.join(', ');
        throw new Error(message);
      } else {
        dispatch({ type: Constants.REGISTER_USER_SUCCESS });
      }
    } catch (error) {
      console.log('login fetch error', error);
      dispatch({ type: Constants.REGISTER_USER_FAILED, payload: error.message });
    }
  };
}

function logout() {
  localStorage.removeItem('user');
  return { type: Constants.LOGOUT };
}

function validateToken() {
  return async (dispatch) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad')
        return dispatch({ type: Constants.VALIDATING_TOKEN, payload: user });

      if (!user) return;

      const payload = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ username: user.username }),
      };

      const response = await fetch('/api/user/validateToken', payload);
      const data = await response.json();

      if (!response.ok) {
        let message = data?.message || data?.errors || response.statusText;
        if (Array.isArray(message)) message.join(', ');
        throw new Error(message);
      } else {
        const decoded = jwtDecode(data.token);
        const user = {
          token: data.token,
          id: decoded.id,
          username: decoded.username,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          email: decoded.email,
          organization: decoded.organization,
          role: decoded.role,
          permissions: decoded.role[0].name,
        };
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: Constants.VALIDATE_TOKEN, payload: user });
      }
    } catch (error) {
      localStorage.removeItem('user');
      dispatch({ type: Constants.INVALID_TOKEN, payload: error.message });
    }
  };
}

function resetLogin() {
  return {
    type: Constants.RESET_LOGIN,
  };
}

function resetRegister() {
  return {
    type: Constants.RESET_REGISTER,
  };
}

import { authHeader } from '../../components/common/AuthHeader.js';
import { Constants } from '../../components/common/Constants';
var jwtDecode = require('jwt-decode');

export const userActions = {
  login,
  logout,
  validateToken,
};

function login(accessToken) {
  try {
    const decoded = jwtDecode(accessToken);
    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      token: accessToken,
      username: decoded.username,
      lastName: decoded.lastName,
      firstName: decoded.firstName,
      organization: decoded.organization,
      permissions: decoded.role[0].name,
    };
    localStorage.setItem('user', JSON.stringify(user));
    return { type: Constants.LOGIN_SUCCESS, payload: user };
  } catch (error) {
    console.log('login error', error);
    return { type: Constants.INVALID_TOKEN, payload: error.message };
  }
}

function logout() {
  localStorage.removeItem('user');
  return { type: Constants.LOGOUT };
}

function validateToken() {
  return async (dispatch) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));

      if (!user || process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') return;

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

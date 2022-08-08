import { authHeader } from '../../components/common/AuthHeader.js';
import { Constants } from '../../components/common/Constants';
var jwtDecode = require('jwt-decode');

export const userActions = {
  login,
  logout,
  validateToken,
  registerNewUser,
};

function login(username, password) {
  return (dispatch) => {
    dispatch({ type: Constants.LOGIN_REQUEST, user: username });

    fetch('/api/user/authenticate', {
      method: 'post',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then(handleResponse)
      .then((user) => {
        var decoded = jwtDecode(user.accessToken);
        user = {
          token: user.accessToken,
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
        dispatch({ type: Constants.LOGIN_SUCCESS, user });
      })
      .catch((error) => {
        console.log(error);
        localStorage.removeItem('user');
        dispatch({ type: Constants.LOGIN_FAILURE, error });
      });
  };
}

function registerNewUser(newUserObj) {
  return (dispatch) => {
    dispatch({ type: Constants.REGISTER_USER_REQUEST });

    fetch('/api/user/registerUser', {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: newUserObj.firstName,
        lastName: newUserObj.lastName,
        email: newUserObj.email,
        username: newUserObj.username,
        password: newUserObj.password,
        confirmPassword: newUserObj.confirmPassword,
        role: 'Creator',
      }),
    })
      .then(handleResponse)
      .then((response) => dispatch({ type: Constants.REGISTER_USER_SUCCESS, status: response.status }))
      .catch((error) => dispatch({ type: Constants.REGISTER_USER_FAILED, error }));
  };
}

function logout() {
  localStorage.removeItem('user');
  return { type: Constants.LOGOUT };
}

function handleResponse(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    data.status = response.status;
    if (!response.ok) {
      const error = (data && data.message) || (data && data.errors) || response.statusText;
      return Promise.reject(error);
    }
    return data;
  });
}

function validateToken() {
  var user = JSON.parse(localStorage.getItem('user'));

  if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') {
    return (dispatch) => dispatch({ type: Constants.VALIDATING_TOKEN, user });
  }

  return (dispatch) => {
    if (user) {
      dispatch({ type: Constants.VALIDATING_TOKEN, user });
      fetch('/api/user/validateToken', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({ username: user.username }),
      })
        .then(handleResponse)
        .then((user) => {
          var decoded = jwtDecode(user.token);
          user = {
            token: user.token,
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
          dispatch({ type: Constants.VALIDATE_TOKEN, user });
        })
        .catch((error) => {
          localStorage.removeItem('user');
          dispatch({ type: Constants.INVALID_TOKEN, error });
        });
    }
  };
}

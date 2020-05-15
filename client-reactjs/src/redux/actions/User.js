import { Constants } from '../../components/common/Constants';
import history from '../../components/common/History';
import { authHeader, handleError } from "../../components/common/AuthHeader.js"
var jwtDecode = require('jwt-decode');

export const userActions = {
    login,
    logout,
    validateToken
};

function login(username, password) {
    let _self = this;
    return dispatch => {
      dispatch(request({ username }));

      fetch('/api/user/authenticate', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      }).then(handleResponse)
      .then(user => {
        var decoded = jwtDecode(user.accessToken);          
        let adminRole = decoded.role.filter(role => role.name == 'Tombolo_Admin');
        var user = {
            "token": user.accessToken,
            "id": decoded.id,
            "username": decoded.username,
            "firstName": decoded.firstName,
            "lastName": decoded.lastName,
            "email": decoded.email,
            "organization": decoded.organization,
            "role":(adminRole.length > 0 ? 'admin' : 'user'),
            "permissions": decoded.role[0].Permissions.map(permission => permission.name)
        }
        localStorage.setItem('user', JSON.stringify(user));
        dispatch(success(user));
      }).catch(error => {
        localStorage.removeItem('user');
        dispatch(failure(error));
      });
    };

    function request(user) { return { type: Constants.LOGIN_REQUEST, user } }
    function success(user) { return { type: Constants.LOGIN_SUCCESS, user } }
    function failure(error) { return { type: Constants.LOGIN_FAILURE, error } }
}

function logout() {
    localStorage.removeItem('user');        
    return { type: Constants.LOGOUT }
}

function handleResponse(response) {
  return response.text().then(text => {
    const data = text && JSON.parse(text);
    if (!response.ok) {
      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }
    return data;
  });
}

function validateToken() {
    var user = JSON.parse(localStorage.getItem('user'));
    return dispatch => {
      if(user) {
        dispatch(validate(user));
        fetch('/api/user/validateToken', {
          method: 'post',
          headers: authHeader(),
          body: JSON.stringify({"username": user.username})
        }).then(handleResponse)
        .then(user => {
          var decoded = jwtDecode(user.token);
          let adminRole = decoded.role.filter(role => role.name == 'Tombolo_Admin');
          user = {
            "token": user.token,
            "id": decoded.id,
            "username": decoded.username,
            "firstName": decoded.firstName,
            "lastName": decoded.lastName,
            "email": decoded.email,
            "organization": decoded.organization,
            "role":(adminRole.length > 0 ? 'admin' : 'user'),
            "permissions": decoded.role[0].Permissions.map(permission => permission.name)
          }
          localStorage.setItem('user', JSON.stringify(user));
          dispatch(success(user));
        })
        .catch(error => {
          localStorage.removeItem('user');
          dispatch(failure(error));
        });
      } 
   };

  function validate(user) { return { type: Constants.VALIDATING_TOKEN, user } }
  function success(user) { return { type: Constants.VALIDATE_TOKEN, user } }
  function failure(error) { return { type: Constants.INVALID_TOKEN, error } }
    
}
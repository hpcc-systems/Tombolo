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
            var user = {
                "token": user.accessToken,
                "firstName": decoded.firstName,
                "lastName": decoded.lastName,
                "email": decoded.email,
                "organization": decoded.organization,
                "role":decoded.role
            }
            localStorage.setItem('user', JSON.stringify(user));
            dispatch(success(user));
        },
        error => {
            dispatch(failure(error.toString()));
        });
    };

    function request(user) { return { type: Constants.LOGIN_REQUEST, user } }
    function success(user) { return { type: Constants.LOGIN_SUCCESS, user } }
    function failure(error) { return { type: Constants.LOGIN_FAILURE, error } }
}

function logout() {
    localStorage.removeItem('user');
    return { type: Constants.LOGOUT };
}

function handleResponse(response) {
    return response.text().then(text => {
        const data = text && JSON.parse(text);
        if (!response.ok) {
            if (response.status === 401) {
                // auto logout if 401 response returned from api
                logout();
                //location.reload(true);
            }

            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}

function validateToken() {
    var user = JSON.parse(localStorage.getItem('user'));
    if(user) {
        fetch('/api/user/validateOrRefreshToken', {
          method: 'post',
          headers: authHeader(),
          body: JSON.stringify({"username": user.username})
        }).then(handleResponse)
        .then(user => {
            localStorage.setItem('user', JSON.stringify(user));
            return { type: Constants.VALIDATE_TOKEN, user };
        },
        error => {
            return { type: Constants.LOGIN_FAILURE };

        });
    }
    return { type: Constants.VALIDATE_TOKEN, user };
}
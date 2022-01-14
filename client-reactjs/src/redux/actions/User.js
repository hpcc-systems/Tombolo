import { Constants } from "../../components/common/Constants";
import history from "../../components/common/History";
import { authHeader, handleError } from "../../components/common/AuthHeader.js";
import { dispatch } from "d3-dispatch";
import { PreConstruct } from "ag-grid-community";
var jwtDecode = require("jwt-decode");

export const userActions = {
  login,
  logout,
  validateToken,
  registerNewUser,
  azureLogin,
};

function login(username, password) {
  let _self = this;
  return (dispatch) => {
    dispatch(request({ username }));

    fetch("/api/user/authenticate", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then(handleResponse)
      .then((user) => {
        var decoded = jwtDecode(user.accessToken);
        var user = {
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
        localStorage.setItem("user", JSON.stringify(user));
        dispatch(success(user));
      })
      .catch((error) => {
        console.log(error);
        localStorage.removeItem("user");
        dispatch(failure(error));
      });
  };

  function request(user) {
    return { type: Constants.LOGIN_REQUEST, user };
  }
  function success(user) {
    return { type: Constants.LOGIN_SUCCESS, user };
  }
  function failure(error) {
    return { type: Constants.LOGIN_FAILURE, error };
  }
}

function registerNewUser(newUserObj) {
  let _self = this;
  return (dispatch) => {
    dispatch(request());

    fetch("/api/user/registerUser", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: newUserObj.firstName,
        lastName: newUserObj.lastName,
        email: newUserObj.email,
        username: newUserObj.username,
        password: newUserObj.password,
        confirmPassword: newUserObj.confirmPassword,
        role: "Creator",
      }),
    })
      .then(handleResponse)
      .then((response) => {
        dispatch(success(response));
      })
      .catch((error) => {
        dispatch(failure(error));
      });
  };

  function request() {
    return { type: Constants.REGISTER_USER_REQUEST };
  }
  function success(response) {
    return { type: Constants.REGISTER_USER_SUCCESS, status: response.status };
  }
  function failure(error) {
    return { type: Constants.REGISTER_USER_FAILED, error: error };
  }
}

function logout() {
  localStorage.removeItem("user");
  return { type: Constants.LOGOUT };
}

function handleResponse(response) {
  return response.text().then((text) => {
    const data = text && JSON.parse(text);
    data.status = response.status;

    if (!response.ok) {
      const error =
        (data && data.message) || (data && data.errors) || response.statusText;
      return Promise.reject(error);
    }
    return data;
  });
}

function validateToken() {
  var user = JSON.parse(localStorage.getItem("user"));
  if (process.env.REACT_APP_APP_AUTH_METHOD === "azure_ad") {
    return (dispatch) => {
      dispatch(success(user));
    };
  }
  return (dispatch) => {
    if (user) {
      dispatch(validate(user));
      fetch("/api/user/validateToken", {
        method: "post",
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
            test: "Test",
          };
          localStorage.setItem("user", JSON.stringify(user));
          dispatch(success(user));
        })
        .catch((error) => {
          localStorage.removeItem("user");
          dispatch(failure(error));
        });
    }
  };

  function validate(user) {
    return { type: Constants.VALIDATING_TOKEN, user };
  }
  function success(user) {
    return { type: Constants.VALIDATE_TOKEN, user };
  }
  function failure(error) {
    return { type: Constants.INVALID_TOKEN, error };
  }
}

// ## Azure login call
function azureLogin(user) {
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
  console.log("Action disptachexd to have user logged in");
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
  return (dispatch) => {
    fetch("/api/user/loginAzureUser", {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        user.id = data.user.id;
        localStorage.setItem("user", JSON.stringify(user));
        history.push("/dataflows");
        dispatch(success(user));
      })
      .catch((error) => {
        console.log(error);
        localStorage.removeItem("user");
        dispatch(failure(error));
      });

    function success(user) {
      return { type: Constants.LOGIN_SUCCESS, user };
    }
    function failure(error) {
      return { type: Constants.LOGIN_FAILURE, error };
    }
  };
}

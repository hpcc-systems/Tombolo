import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader';

export const authActions = {
  login,
  logout,
  registerBasicUser,
  loadUserFromStorage,
};

async function login({ email, password }) {
  const user = await loginBasicUserFunc(email, password);

  if (user && user.data) {
    user.data.isAuthenticated = true;

    //set item in local storage
    localStorage.setItem('user', JSON.stringify(user.data));

    return {
      type: Constants.LOGIN_SUCCESS,
      payload: user,
    };
  }

  return;
}

function logout() {
  //remove item from local storage
  localStorage.removeItem('user');

  fetch('/api/auth/logout', { headers: authHeader() });

  return {
    type: Constants.LOGOUT_SUCCESS,
  };
}

function loadUserFromStorage() {
  const user = JSON.parse(localStorage.getItem('user'));

  if (user) {
    return {
      type: Constants.LOGIN_SUCCESS,
      payload: user,
    };
  }

  return;
}

async function registerBasicUser(values) {
  const user = await registerBasicUserFunc(values);

  if (user) {
    //log in user
    const loginResponse = await loginBasicUserFunc(values.email, values.password);

    if (loginResponse) {
      let data = loginResponse.data;
      data.isAuthenticated = true;

      //set item in local storage
      localStorage.setItem('user', JSON.stringify(data));

      return {
        type: Constants.LOGIN_SUCCESS,
        payload: data,
      };
    }
  }

  return;
}

const registerBasicUserFunc = async (values) => {
  const url = '/api/auth/registerBasicUser';

  values.registrationMethod = 'traditional';

  const response = await fetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    },
    { headers: authHeader() }
  );

  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  return data;
};

const loginBasicUserFunc = async (email, password) => {
  const url = '/api/auth/loginBasicUser';

  const response = await fetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
    { headers: authHeader() }
  );

  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  return data;
};

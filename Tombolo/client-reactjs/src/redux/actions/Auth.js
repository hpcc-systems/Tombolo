import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader';

export const authActions = {
  login,
  logout,
  registerBasicUser,
  loadUserFromStorage,
  registerOwner,
};

async function login({ email, password, deviceInfo }) {
  const user = await loginBasicUserFunc(email, password, deviceInfo);

  if (user && user.data) {
    user.data.isAuthenticated = true;

    //set item in local storage
    localStorage.setItem('user', JSON.stringify(user.data));

    return {
      type: Constants.LOGIN_SUCCESS,
      payload: user,
    };
  } else {
    return {
      type: Constants.LOGIN_FAILED,
      payload: user,
    };
  }
}

function logout() {
  fetch('/api/auth/logoutBasicUser', { headers: authHeader(), method: 'POST' });
  //remove item from local storage
  localStorage.removeItem('user');

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
    const loginResponse = await loginBasicUserFunc(values.email, values.password, values.deviceInfo);

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

async function registerOwner(values) {
  const user = await registerOwnerFunc(values);

  if (user) {
    //log in user
    const loginResponse = await loginBasicUserFunc(values.email, values.password, values.deviceInfo);

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

const loginBasicUserFunc = async (email, password, deviceInfo) => {
  const url = '/api/auth/loginBasicUser';

  const response = await fetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, deviceInfo }),
    },
    { headers: authHeader() }
  );

  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  console.log(response);
  console.log(data);

  return data;
};

const registerOwnerFunc = async (values) => {
  const url = '/api/auth/registerApplicationOwner';

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

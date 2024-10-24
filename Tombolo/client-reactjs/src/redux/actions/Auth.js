import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader';

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
  }

  return;
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

const registerBasicUser = async (values) => {
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

  return data;
};

const registerOwner = async (values) => {
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

export const authActions = {
  login,
  logout,
  registerBasicUser,
  loadUserFromStorage,
  registerOwner,
};

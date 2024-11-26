import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader';
import { message } from 'antd';
import { setUser, getUser } from '../../components/common/userStorage';

async function login({ email, password, deviceInfo }) {
  const user = await loginBasicUserFunc(email, password, deviceInfo);

  if (user && user.data) {
    user.data.isAuthenticated = true;

    //set item in local storage
    setUser(JSON.stringify(user.data));

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
  const user = getUser();

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

  console.log('loginBasicUserFunc', email, password, deviceInfo);

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

const loginOrRegisterAzureUser = async (code) => {
  const url = '/api/auth/loginOrRegisterAzureUser';
  const response = await fetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(code),
    },
    { headers: authHeader() }
  );

  if (!response.ok) {
    handleError(response);
    return null;
  }

  const data = await response.json();

  if (data.success) {
    data.data.isAuthenticated = true;
    //set item in local storage
    setUser(JSON.stringify(data.data));
    return {
      type: Constants.LOGIN_SUCCESS,
      payload: data.data,
    };
  } else {
    return {
      type: Constants.LOGIN_FAILED,
      payload: data.data,
    };
  }
};

const azureLoginRedirect = () => {
  try {
    const response_type = 'code';
    const response_mode = 'query';
    const redirect_uri = process.env.REACT_APP_AZURE_REDIRECT_URI;
    const scope = 'openid';
    const client_id = process.env.REACT_APP_AZURE_CLIENT_ID;
    const tenant_id = process.env.REACT_APP_AZURE_TENENT_ID;

    const url = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&response_mode=${response_mode}`;

    window.location.href = url;
  } catch (e) {
    console.log(e);
    message.error('An error occurred while trying to login with Microsoft.');
  }
};

export const authActions = {
  login,
  logout,
  registerBasicUser,
  loadUserFromStorage,
  registerOwner,
  azureLoginRedirect,
  loginOrRegisterAzureUser,
};

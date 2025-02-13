import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader';
import { message } from 'antd';
import { setUser, getUser } from '../../components/common/userStorage';

//function to centralize storage clearing
const clearStorage = () => {
  //localStorage.removeItem('user');
  //clear whole storage on login and logout to ensure nothing is kept unecessarily
  localStorage.clear();
};

async function login({ email, password, deviceInfo }) {
  clearStorage();
  const user = await loginBasicUserFunc(email, password, deviceInfo);

  if (user && user?.message === 'password-expired') {
    return {
      type: 'password-expired',
      payload: null,
    };
  } else if (user && user?.message === 'unverified') {
    return {
      type: 'unverified',
      payload: null,
    };
  } else if (user && user.data) {
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

  clearStorage();

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
  clearStorage();
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
  const data = await response.json();

  if (response.status === 401 || response.status === 403) {
    if (data.message === 'unverified') {
      return data;
    } else {
      message.error(data.message);
      return;
    }
  } else if (!response.ok) {
    handleError(response);
    return null;
  }

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
  clearStorage();
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

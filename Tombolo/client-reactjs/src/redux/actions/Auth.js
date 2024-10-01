import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader';

export const authActions = {
  login,
  logout,
  registerBasicUser,
};

function login(email, password) {
  console.log(email, password);
  //   return {
  //     type: Constants.LOGIN_SUCCESS,
  //     payload: { token, refreshToken, user },
  //   };

  return;
}

function logout(user) {
  console.log(user);
  return {
    type: Constants.LOGOUT_SUCCESS,
  };
}

async function registerBasicUser(values) {
  const user = await registerBasicUserFunc(values);

  if (user) {
    //log in user
    const loginResponse = await loginBasicUserFunc(values.email, values.password);
    console.log(loginResponse);
    if (loginResponse) {
      let data = loginResponse.data;
      data.isAuthenticated = true;
      console.log(data);

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

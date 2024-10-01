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
    alert('user registered, next PR we will log user in after succesful registration');
  }
  //   return {
  //     type: Constants.REFRESH_TOKEN_SUCCESS,
  //     payload: { token },
  //   };
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

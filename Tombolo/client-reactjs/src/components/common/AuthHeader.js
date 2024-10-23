// import { userActions } from '../../redux/actions/User';
import { store } from '../../redux/store/Store';
import { authActions } from '../../redux/actions/Auth';
import { message } from 'antd';
import { getRoleNameArray } from './AuthUtil';

export function handleError(response) {
  message.config({ top: 130 });

  //if response is an empty object, simply return
  if (Object.keys(response).length === 0) {
    return;
  }

  //if response is false, it means that we cannot communicate with backend, set backend status to false so UI will show error message
  if (response === false) {
    store.dispatch({ type: 'SET_BACKEND_STATUS', payload: false });
    return;
  }

  response.json().then((data) => {
    if (data.message) {
      message.error(data.message);
    } else {
      message.error('An undefined error occurred. Please try again later');
    }
  });
}

// When the client sends a fetch request the header requires an auth token.
// This function grabs the token from the Local Storage. The returned value is palaced in the header of the API calls
// If the application is using Azure sso, the fetch request are intercepted and the headers are modified with fresh azure token
export function authHeader(action) {
  // return authorization header with jwt token
  let user = JSON.parse(localStorage.getItem('user'));

  if (user?.token && action) {
    return {
      Authorization: user.token,
    };
  } else if (user?.token) {
    return {
      Authorization: user.token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  } else {
    return { Accept: 'application/json', 'Content-Type': 'application/json' };
  }
}

const { fetch: originalFetch } = window;

window.fetch = async (...args) => {
  let [resource, config] = args;

  try {
    let allowed = checkPermissions(resource, config);

    if (!allowed) {
      message.error('You do not have permission to perform this action');
      return {};
    }

    const response = await originalFetch(resource, config);

    //if response.status is 401, it means the refresh token has expired, so we need to log the user out
    if (response.status === 401) {
      authActions.logout();
      localStorage.setItem('sessionExpired', true);
      window.location.href = '/login';

      return {};
    }
    const user = JSON.parse(localStorage.getItem('user'));

    //see if token is returned from the backend, if so, check it against local storage token and update if necessary
    const token = response.headers.get('Authorization');

    if (token) {
      //if user doesn't exist, return
      if (!user) return;
      if (user?.token !== token) {
        user.token = token;
        await localStorage.setItem('user', JSON.stringify(user));

        //if new token is provided, we need to make a new fetch call with the new token
        config.headers = {
          ...config.headers,
          Authorization: token,
        };
        const newTokenResponse = await originalFetch(resource, config);
        return newTokenResponse;
      }
    }

    return response;
  } catch (error) {
    // if an error is caught here, it means we cannot communicate with backend, return false to indicate that and log error
    if (error.name === 'AbortError') {
      console.log(`Request to ${resource} was aborted`);
    } else {
      console.log('Error:', error);
    }
    return false;
  }
};

const checkPermissions = (resource, config) => {
  const user = JSON.parse(localStorage.getItem('user'));

  //first, if there is no user, we need to check if the resource is a permitted resource without having a user
  if (!user) {
    const permittedResourcesWithoutUser = ['/api/status', '/api/auth'];

    //check if resource starts with any of the permitted resources
    let permitted = false;
    for (let i = 0; i < permittedResourcesWithoutUser.length; i++) {
      if (resource.startsWith(permittedResourcesWithoutUser[i])) {
        permitted = true;
        break;
      }
    }

    return permitted;
  } else {
    //user exists, we need to check users roles and method to verify they can send this call
    let method = null;
    if (config?.method) {
      method = config.method;
    }

    if (config?.headers?.method) {
      method = config.headers.method;
    }

    if (method === null) {
      method = 'GET';
    }

    let userRoles = getRoleNameArray();

    //if user is only a reader, we don't want to make any fetch calls that are not GET
    if (userRoles.length === 1 && userRoles.includes('reader') && method !== 'GET') {
      return false;
    } else {
      return true;
    }
  }
};

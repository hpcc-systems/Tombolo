// import { userActions } from '../../redux/actions/User';
import { store } from '../../redux/store/Store';
import { message } from 'antd';

export function handleError(response) {
  message.config({ top: 130 });

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
  if (user && user.token && action) {
    return {
      Authorization: user.token,
    };
  } else if (user && user.token) {
    return {
      Authorization: user.token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  } else {
    return {};
  }
}

const { fetch: originalFetch } = window;

window.fetch = async (...args) => {
  let [resource, config] = args;
  // request interceptor here
  config.headers = authHeader(true);
  try {
    const response = await originalFetch(resource, config);
    // response interceptor here
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

import { userActions } from '../../redux/actions/User';
import { store } from '../../redux/store/Store';
import { message } from 'antd/lib';
import { msalInstance } from '../../index';
import {silentRequestOptions} from '../azureSso/azureAuthConfig'

export function handleError(response) {
  message.config({ top: 130 });
  if (response.status == 401) {
    //token expired
    localStorage.removeItem('user');
    store.dispatch(userActions.logout());
  } else if (response.status == 422) {
    throw Error('Error occurred while saving the data. Please check the form data');
  } else {
    let errorMessage = '';
    response.json().then((responseData) => {
      errorMessage = responseData.message;
      //throw new Error(errorMessage);
      message.error(errorMessage);
    });
  }
}

// When the client sends a fetch request the header requires an auth token.
// This function grabs the token from the Local Storage. The returned value is palaced in the header of the API calls
// If the application is using Azure sso, the fetch request are intercepted and the headers are modified with fresh azure token
export function authHeader(action) {
  // return authorization header with jwt token
  let user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token && action) {
    return {
      Authorization: 'Bearer ' + user.token,
    };
  } else if (user && user.token) {
    return {
      Authorization: 'Bearer ' + user.token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  } else {
    return {};
  }
}

// This async function gets the refresh token for the active azure account
// The refreshed/latest token  replaces the existing token by intercepting the API calls
// Block of code below this one is doing the intercepting and replacing job
export async function getFreshAzureToken(msalInstance) {
  const currentAccount = msalInstance.getActiveAccount();

  //If no current account found throw error
  if (currentAccount) {
    const silentRequest = {
      scopes : ['api://10e4b085-3fe6-40b8-966e-0201f2553617/access_as_user'],
      account: currentAccount,
      forceRefresh: false,
    };
    const freshToken = await msalInstance.acquireTokenSilent(silentRequest).catch((err) => {
      console.log(err);
    });

    if (freshToken.accessToken) {
      return 'Bearer ' + freshToken.accessToken;
    } else {
      console.log('could not get id token');
      return '';
    }
  } else {
    return console.log('No active account');
  }
}

//if Azure sso is being used intercept all the fetch requests and update token for necessary routes
if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') {
  const newFetch = window.fetch;

  window.fetch = async function () {
    if (arguments[1].headers.Authorization) {
      let newToken = await getFreshAzureToken(msalInstance);
      arguments[1].headers = { Authorization: newToken, Accept: 'application/json', 'Content-Type': 'application/json' };
      return newFetch.apply(this, arguments);
    } else {
      return newFetch.apply(this, arguments);
    }
  };
}

const { fetch: originalFetch } = window;

window.fetch = async (...args) => {  
  let [resource, config ] = args;  
  // request interceptor here
  if(resource.startsWith("/api")) {
    resource = process.env.REACT_APP_PROXY_URL + resource;
  }
  const response = await originalFetch(resource, config);
  // response interceptor here
  return response;
};


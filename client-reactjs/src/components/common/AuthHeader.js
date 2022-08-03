import { userActions } from '../../redux/actions/User';
import { store } from '../../redux/store/Store';
import { message } from 'antd';
import { msalInstance } from '../../index';

import { InteractionRequiredAuthError } from "@azure/msal-browser";

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
  // if we use Azure we will append tokens in fetch interceptor with getAzureHeaders()
  // as it requires async logic and this is sync function, refactoring will take a lot of changes.
  if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') return {}
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
async function getAzureHeaders() {
  // get active account that was set up in AzureApp component
  const account = msalInstance.getActiveAccount();     
  // Identify scope and and account to request token silently  
  const silentRequest = { account, scopes: [process.env.REACT_APP_AZURE_API_TOKEN_SCOPE], };
  try {
  // No account mean that user wa not signed in, we can not acquire tokens, so we will return empty headers object.
  if (!account) throw InteractionRequiredAuthError.createNoTokensFoundError();
  
   // token is in local storage we will get it from there, if it is expired we will get a fresh one.
   const tokens = await msalInstance.acquireTokenSilent(silentRequest);
   // return headers object with access token to append to request.
   return {
     Authorization: 'Bearer ' + tokens.accessToken,
     Accept: 'application/json',
     'Content-Type': 'application/json',
   };

 } catch (error) {
   console.log('-----failed to get tokens-------------------------------------');
   console.dir({error});
   
   // in case if silent token acquisition fails, fallback to an interactive method
   if (error instanceof InteractionRequiredAuthError) {
    // This method will initiate a full-frame redirect and the response will be handled when returning to the application.
    //  When this component is rendered after returning from the redirect, acquireTokenSilent should now succeed 
    //  as the tokens will be pulled from the cache.
    msalInstance.acquireTokenRedirect(silentRequest);
    //we could use popup but we do not allow iframes;
    // const tokens = await msalInstance.acquireTokenPopup(silentRequest); 

    //    return {
    //      Authorization: 'Bearer ' + tokens.accessToken,
    //      Accept: 'application/json',
    //      'Content-Type': 'application/json',
    //    };
   }
   // failed to get token from localstorage and by interactive request, use is not allowed to go further, backend will respond with 401 
   return {};
 }
}

const { fetch: originalFetch } = window;

window.fetch = async (...args) => {  
  let [resource, config ] = args;  
  // request interceptor here
  if(resource.startsWith("/api")) {
    resource = process.env.REACT_APP_PROXY_URL + resource;
    if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') {
      // get token for each request and append to headers, will over write Authorization, Accept, Content-Type fields!!!
      const azureHeaders = await getAzureHeaders();
      config.headers = { ...config.headers, ...azureHeaders };
    }
  } 
  const response = await originalFetch(resource, config);
  // response interceptor here
  return response;
};


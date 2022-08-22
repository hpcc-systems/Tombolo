import { MsalAuthenticationTemplate, useIsAuthenticated, useMsal } from '@azure/msal-react';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { InteractionType } from '@azure/msal-browser';

import { loginRequest } from './azureAuthConfig';
import { Constants } from '../common/Constants';
import Fallback from '../common/Fallback';
import ErrorPage from '../common/ErrorPage';

const AzureApp = ({ children }) => {
  const dispatch = useDispatch();

  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = accounts[0] || null;

  const silentTokenOptions = {
    ...loginRequest,
    account,
    forceRefresh: true,
    redirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI,
  };

  useEffect(() => {
    if (account && inProgress === 'none') {
      // set account to Active for interceptor to send HTTPS with fresh tokens
      instance.setActiveAccount(account);

      (async () => {
        try {
          const tokens = await instance.acquireTokenSilent(silentTokenOptions); //to acquire tokens silently we need to provide account.

          const user = {
            token: tokens.accessToken,
            email: account.username,
            roles: account.idTokenClaims.roles,
            lastName: account.name.split(',')[0],
            firstName: account.name.split(' ')[1],
            id: account.idTokenClaims.preferred_username.split('@')[0],
            username: account.idTokenClaims.preferred_username.split('@')[0],
          };

          dispatch({ type: Constants.LOGIN_SUCCESS, payload: user });
        } catch (error) {
          console.log('error', error);
          //in case if silent token acquisition fails, fallback to an interactive method
          instance.acquireTokenRedirect(loginRequest);
        }
      })();
    }
  }, [account, inProgress]);

  return (
    <MsalAuthenticationTemplate
      errorComponent={ErrorPage}
      loadingComponent={Fallback}
      authenticationRequest={loginRequest} //set of scopes to pre-consent to while sign in
      interactionType={InteractionType.Redirect}>
      {/* taking App as a child component and passing authWithAzure flag as a prop. child will be available if user is authenticated with azure*/}
      {React.cloneElement(children, { authWithAzure: isAuthenticated })}
    </MsalAuthenticationTemplate>
  );
};

export default AzureApp;

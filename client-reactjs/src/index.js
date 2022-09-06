import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { BrowserRouter } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';

import './index.css';
import './i18n/i18n.js';

import { Provider } from 'react-redux';
import { store } from './redux/store/Store';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './components/azureSso/azureAuthConfig';
import AzureApp from './components/azureSso/AzureApp';

export const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      {process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad' ? (
        <MsalProvider instance={msalInstance}>
          <AzureApp>
            <App />
          </AzureApp>
        </MsalProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);

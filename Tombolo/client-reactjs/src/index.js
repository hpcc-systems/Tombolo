import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { BrowserRouter } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';

import './index.css';

import { Provider } from 'react-redux';
import { store } from './redux/store/Store';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './components/azureSso/azureAuthConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);

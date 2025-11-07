// apiClient.js
import axios from 'axios';

import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
// import { retryInterceptor } from './interceptors/retry.interceptor';
import { dataExtractorInterceptor } from './interceptors/dataExtractor.interceptor';

// ------------------
// Base Axios Client
// ------------------
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  maxBodyLength: 50 * 1024 * 1024, // 50MB
  maxRedirects: 5,
  xsrfCookieName: 'x-csrf-token',
  xsrfHeaderName: 'x-csrf-token',
});

// ------------------
// Apply interceptors
// ------------------
// retryInterceptor(apiClient);
authInterceptor(apiClient);
errorInterceptor(apiClient);
dataExtractorInterceptor(apiClient);

export { apiClient };

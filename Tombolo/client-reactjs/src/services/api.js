// apiClient.js
import axios from 'axios';
// eslint-disable-next-line unused-imports/no-unused-imports
import axiosRetry from 'axios-retry';

import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { retryInterceptor } from './interceptors/retry.interceptor';
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
// Axios Retry Setup
// TODO - causes more issues than it solves. commented out for now
// ------------------
// axiosRetry(apiClient, {
//   retries: 2,
//   retryDelay: axiosRetry.exponentialDelay,
//   retryCondition: (error) => {
//     // Retry on network errors or 5xx responses
//     return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
//   },
//   onRetry: (retryCount, error, requestConfig) => {
//     requestConfig._isRetryAttempt = true;
//     requestConfig._retryCount = retryCount;
//     requestConfig._maxRetries = 2;
//   },
// });

// ------------------
// Apply interceptors
// ------------------
retryInterceptor(apiClient);
authInterceptor(apiClient);
errorInterceptor(apiClient);
dataExtractorInterceptor(apiClient);

export { apiClient };

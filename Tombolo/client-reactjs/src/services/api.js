// Third-party imports
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Local imports
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { retryInterceptor } from './interceptors/retry.interceptor';

// Base axios configuration
const apiClient = axios.create({
  baseURL: `/api`,
  timeout: 30000,
  withCredentials: true, // Include cookies for CSRF
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  },
  //Request size limits
  maxBodyLength: 50 * 1024 * 1024, // 50MB request limit
  maxRedirects: 5,
  //CSRF configuration
  xsrfCookieName: 'x-csrf-token',
  xsrfHeaderName: 'x-csrf-token',
});

//Retry configuration
axiosRetry(apiClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500; // Retry on network errors and 5xx status codes
  },
  onRetry: (retryCount, error, requestConfig) => {
    // Mark this request as a retry attempt
    requestConfig._isRetryAttempt = true;
    requestConfig._retryCount = retryCount;
    requestConfig._maxRetries = 2; // Match retries count
  },
});

// Apply interceptors
authInterceptor(apiClient);
errorInterceptor(apiClient);
retryInterceptor(apiClient);

export { apiClient };
export default apiClient;

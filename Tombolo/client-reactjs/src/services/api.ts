import axios, { AxiosInstance } from 'axios';

import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { dataExtractorInterceptor } from './interceptors/dataExtractor.interceptor';

// ------------------
// Base Axios Client
// ------------------
const apiClient: AxiosInstance = axios.create({
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
});

// ------------------
// Apply interceptors
// ------------------
authInterceptor(apiClient);
errorInterceptor(apiClient);
dataExtractorInterceptor(apiClient);

export { apiClient };

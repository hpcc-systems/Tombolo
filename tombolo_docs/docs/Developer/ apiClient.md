# Centralized Axios API Client (api.js)

The api.js file defines a centralized API client using Axios, serving as the foundation for all frontend HTTP requests. It standardizes configuration, retry metadata tracking, authentication, and global error normalization across the app

## Responsibilities

1. **Axios Configuration**

   - Sets the base URL for API requests.
   - Configures timeout, headers, cookies, CSRF protection, max body size, and redirects.

2. **Retry Logic**

   - Uses `axios-retry` to automatically retry requests on network errors or 5xx server responses.
   - Adds metadata (`retryCount`, `startTime`) via `retryInterceptor` for debugging and tracking retries.

3. **Authentication**

   - `authInterceptor` attaches the access token to requests.
   - Handles route authorization and token refresh for expired access tokens.

4. **Error Handling**

   - `errorInterceptor` normalizes backend errors into a consistent structure for the service layer.

## Interceptors

The interceptors are attached in the following order: `retryInterceptor`, `authInterceptor`, `errorInterceptor`. See the documentation below for more details about each interceptor.

---

# Error Interceptor

The error interceptor is responsible for handling **global errors** that occur during Axios requests and ensuring all errors are normalized into a **consistent shape**.

It does not display UI notifications or handle presentation. Its only job is to intercept, categorize, and normalize errors into a consistent structure that can be safely used by services or passed to a centralized error handling utility in the UI.

## Responsibilities

1. **Catch errors** from Axios responses (`response` and network-level errors).
2. **Classify errors** into high-level types (`NETWORK_ERROR`, `AUTH_ERROR`, `FORBIDDEN`, `API_ERROR`).
3. **Normalize error messages** into an array (`messages: []`), regardless of backend format.

   - Uses `data.messages` if available.
   - Falls back to wrapping `data.message` in an array.
   - Defaults to `['An error occurred']` if neither exists.

4. **Provide consistent error shape** for consumers (services, Redux thunks, components).

## Error Types Handled

- **Network Errors** (`NETWORK_ERROR`)

  - No response from server (e.g., server down, connection lost, CORS issue).
  - Normalized shape: `{ type: 'NETWORK_ERROR', status: null, messages: ['Unable to reach the server'] }`

- **Authentication Errors** (`AUTH_ERROR`)

  - Response with `401 Unauthorized` (excluding login route).
  - Indicates expired/invalid session.
  - Normalized with: `{ type: 'AUTH_ERROR', status: 401, messages: ['Authentication required'] }`

- **Authorization Errors** (`FORBIDDEN`)

  - Response with `403 Forbidden`.
  - Indicates insufficient permissions.
  - Normalized with: `{ type: 'FORBIDDEN', status: 403, messages: ['Permission denied'] }`

- **Backend API Errors** (`API_ERROR`)

  - Any other `4xx` or `5xx` response.
  - Normalized from `response.data.messages` or `response.data.message`.
  - Always returned as an array of strings.

## Normalized Error Shape

Every error returned by the interceptor has the following structure:

```ts
{
  type: 'NETWORK_ERROR' | 'AUTH_ERROR' | 'FORBIDDEN' | 'API_ERROR',
  status: number | null,         // HTTP status code (null for network errors)
  messages: string[],            // Always an array of strings
  raw: any,                      // Original response data (if available)
  originalError: AxiosError      // The unmodified Axios error object
}
```

---

# Auth Interceptor

The auth interceptor handles all authentication tasks for Axios requests. It automatically attaches tokens, refreshes expired tokens, and blocks requests to routes the user is not authorized to access.

## Responsibilities

1. **Attach Authorization Header**

   - Adds the access token (e.g., `Bearer <token>`) automatically to every request.

2. **Handle Token Refresh**

   - Intercepts `401 Unauthorized` responses caused by expired access tokens.
   - Calls the refresh token endpoint or refresh service to obtain a new token.
   - Updates the stored access token (localStorage, cookies, or Redux store).
   - Retries the original request automatically with the refreshed token.
   - If refresh fails, the error is passed to the error interceptor for further handling.

3. **Route Authorization Check**

   - Blocks requests to endpoints that the current user does not have permission to access.
   - Implements role/permission checks in the request interceptor.

4. **Logging in Development Environment**

   - Logs request URLs, methods, or durations for debugging or analytics.

## Example Flow

1. UI Component calls `authService.someRequest()`.
2. The auth interceptor adds the access token to the request.
3. Request is sent to the backend.
4. Backend responds with `401 Unauthorized` if the token is expired.
5. Auth interceptor calls the refresh token endpoint and updates the stored token.
6. The original request is retried automatically with the new token.
7. If the retry succeeds, the response is returned to the service/component.
8. If the retry fails, the error is passed to the `errorInterceptor` for normalization.

---

# Retry Interceptor

The retry interceptor attaches metadata to Axios requests for **tracking retry attempts** and optionally logging them. It works together with `axios-retry`, which performs the actual retry logic.

## Responsibilities

1. **Attach Retry Metadata**

   - Adds a `metadata` object to each request containing:

     - `startTime`: timestamp when the request was sent
     - `retryCount`: current retry count from `axios-retry` config (or 0)

2. **Pass Responses Through**

   - Returns successful responses unchanged.
   - Rejects errors after retries are exhausted.

3. **Developer Debugging Hooks**

   - A placeholder for logging retry attempts, durations, or counts in development environment.

## Example Flow

1. Component or service calls `apiClient.someRequest()`.
2. Retry interceptor attaches `metadata` to the request.
3. Axios-retry evaluates if the request should be retried (network error or 5xx).
4. If retried, `metadata.retryCount` is updated automatically.
5. If all retries succeed, response is returned.
6. If retries fail, error proceeds to `errorInterceptor` for normalization.

---

# Data Extractor Interceptor

The data extractor interceptor transforms successful API responses to simplify data access by unwrapping nested `data` fields from the backend's response structure.

## Responsibilities

1. **Unwrap Nested Data**

   - For responses with `success: true`, extracts `response.data.data` and sets it as `response.data` to remove nesting.

2. **Pass Errors Through**
   - Rejects errors unchanged, allowing the `errorInterceptor` to normalize them.

## Example Flow

1. Backend returns `{ success: true, message: 'OK', data: [payload], errors: [] }`.
2. Data extractor interceptor checks `response.data.success`.
3. If `success: true`, sets `response.data = [payload]`.
4. If `success: false` or error, passes the response/error to the next interceptor.
5. Services (e.g., `landingZoneMonitoringService`) receive `response.data` as the payload directly.

## Notes

- Assumes consistent backend response structure (`{ success, data, message, errors }`).
- Applied after `authInterceptor` and `retryInterceptor`, before `errorInterceptor`.

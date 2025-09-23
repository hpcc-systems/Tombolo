import { message } from 'antd';
import { getRoleNameArray } from './AuthUtil';

const csrfHeaderName = 'x-csrf-token';

export function handleError(response) {
  message.config({ top: 130 });

  //if response is false, it means that we cannot communicate with backend, set backend status to false so UI will show error message
  if (response === false) {
    import('@/redux/store/Store').then(async ({ store }) => {
      const { setBackendStatus } = await import('@/redux/slices/BackendSlice'); // if needed
      store.dispatch(setBackendStatus(false));
    });
    return;
  }

  //check if response has a body and it is not used
  if (response.body && !response.bodyUsed) {
    response.json().then((data) => {
      if (data.message) {
        message.error(data.message);
      } else {
        message.error('An undefined error occurred. Please try again later');
      }
    });
  } else {
    message.error('An undefined error occurred. Please try again later');
  }
}

// When the client sends a fetch request the header requires an auth token.
// This function grabs the token from the Local Storage. The returned value is palaced in the header of the API calls
// If the application is using Azure sso, the fetch request are intercepted and the headers are modified with fresh azure token
export function authHeader() {
  //grab csrf token directly from cookie and echo it back in proper header name
  let csrfToken = document.cookie.split(';').find((cookie) => cookie.trim().startsWith(csrfHeaderName + '='));

  if (csrfToken) {
    csrfToken = csrfToken.split('=')[1].split('%')[0];
    return { Accept: 'application/json', 'Content-Type': 'application/json', [csrfHeaderName]: csrfToken };
  }
  return { Accept: 'application/json', 'Content-Type': 'application/json' };
}

const { fetch: originalFetch } = window;

window.fetch = async (...args) => {
  let [resource, config] = args;

  try {
    let allowed = checkPermissions(resource, config);

    if (!allowed) {
      message.error('You do not have permission to perform this action');
      return {};
    }

    const response = await originalFetch(resource, config);

    // Prevent infinite redirect loop: only redirect if not already on an auth route
    if (response.status === 401 && resource !== '/api/auth/loginBasicUser') {
      const currentPath = window.location.pathname;
      const authRoutes = ['/login', '/register', '/reset-password', '/forgot-password', '/reset-temporary-password'];
      const isAuthRoute = authRoutes.some((route) => currentPath.startsWith(route));
      if (!isAuthRoute) {
        import('@/redux/store/Store').then(async ({ store }) => {
          const { logout } = await import('@/redux/slices/AuthSlice');
          store.dispatch(logout());
        });
        localStorage.setItem('sessionExpired', true);
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    // if an error is caught here, it means we cannot communicate with backend, return false to indicate that and log error
    if (error.name === 'AbortError') {
      console.log(`Request to ${resource} was aborted`);
    } else {
      console.log('Error:', error);
    }
    return false;
  }
};

const checkPermissions = (resource, config) => {
  const user = JSON.parse(localStorage.getItem('user'));

  //if the resource is a logout call, we want to allow it
  const isLogout = resource.includes('/api/auth/logout');
  if (isLogout) {
    return true;
  }

  //first, if there is no user, we need to check if the resource is a permitted resource without having a user
  if (!user) {
    const permittedResourcesWithoutUser = ['/api/status', '/api/auth', '/api/wizard'];

    //check if resource starts with any of the permitted resources
    let permitted = false;
    for (let i = 0; i < permittedResourcesWithoutUser.length; i++) {
      if (resource.startsWith(permittedResourcesWithoutUser[i])) {
        permitted = true;
        break;
      }
    }

    return permitted;
  } else {
    //user exists, we need to check users roles and method to verify they can send this call
    let method = null;
    if (config?.method) {
      method = config.method;
    }

    if (config?.headers?.method) {
      method = config.headers.method;
    }

    if (method === null) {
      method = 'GET';
    }

    let userRoles = getRoleNameArray();

    //create list of allowed routes that even readers can access
    const allowedRoutesForReaders = [`/api/user/${user.id}`];

    //check if resource starts with any of the allowed routes for readers
    let allowed = false;
    for (let i = 0; i < allowedRoutesForReaders.length; i++) {
      if (resource.startsWith(allowedRoutesForReaders[i])) {
        allowed = true;
        break;
      }
    }

    //if user is only a reader, we don't want to make any fetch calls that are not GET
    if (userRoles.length === 1 && userRoles.includes('reader') && method !== 'GET' && !allowed) {
      return false;
    } else {
      return true;
    }
  }
};

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authHeader, handleError } from '@/components/common/AuthHeader';
import { message } from 'antd';
import { getUser, setUser } from '@/components/common/userStorage';
import { Constants } from '@/components/common/Constants';

const initialState = {
  isAuthenticated: false,
  token: null,
  roles: [],
  applications: [],
  user: null,
  firstName: '',
  lastName: '',
  id: '',
  loading: false,
  error: null,
};

// Function to centralize storage clearing
const clearStorage = () => {
  localStorage.clear();
};

// Helper function for basic user login
const loginBasicUserFunc = async (email, password, deviceInfo) => {
  clearStorage();
  const url = '/api/auth/loginBasicUser';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, deviceInfo }),
  });

  const data = await response.json();

  if (response.status === 401 || response.status === 403) {
    if (data.message === Constants.LOGIN_UNVERIFIED) {
      return data;
    } else if (data.message === Constants.LOGIN_TEMP_PW) {
      return data;
    } else {
      message.error(data.message);
      return { message: data.message, type: Constants.LOGIN_FAILED };
    }
  } else if (!response.ok) {
    handleError(response);
    throw new Error('Login failed');
  }

  return data;
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  // eslint-disable-next-line unused-imports/no-unused-vars
  async ({ email, password, deviceInfo }, { dispatch, rejectWithValue }) => {
    clearStorage();

    try {
      const user = await loginBasicUserFunc(email, password, deviceInfo);

      if (user && user?.message === Constants.LOGIN_TEMP_PW) {
        return {
          type: Constants.LOGIN_TEMP_PW,
          user,
        };
      } else if (user && user?.message === Constants.LOGIN_PW_EXPIRED) {
        return {
          type: Constants.LOGIN_PW_EXPIRED,
          user: null,
        };
      } else if (user && user?.message === Constants.LOGIN_UNVERIFIED) {
        return {
          type: Constants.LOGIN_UNVERIFIED,
          user: null,
        };
      } else if (user && user.data) {
        user.data.isAuthenticated = true;
        setUser(JSON.stringify(user.data));
        return {
          type: Constants.LOGIN_SUCCESS,
          user: user.data,
        };
      } else {
        return {
          type: Constants.LOGIN_FAILED,
          user: user,
        };
      }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await fetch('/api/auth/logoutBasicUser', {
      headers: authHeader(),
      method: 'POST',
    });
  } catch (error) {
    // Even if logout API fails, we still want to clear local storage
    console.log('Logout API call failed:', error);
  }

  clearStorage();
  return null;
});

export const loadUserFromStorage = createAsyncThunk('auth/loadUserFromStorage', async () => {
  const user = getUser();
  return user || null;
});

export const registerBasicUser = createAsyncThunk('auth/registerBasicUser', async (values) => {
  const url = '/api/auth/registerBasicUser';
  values.registrationMethod = 'traditional';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    handleError(response);
    throw new Error('Registration failed');
  }

  return await response.json();
});

export const registerOwner = createAsyncThunk('auth/registerOwner', async (values) => {
  const url = '/api/auth/registerApplicationOwner';
  values.registrationMethod = 'traditional';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    handleError(response);
    throw new Error('Owner registration failed');
  }

  return await response.json();
});

export const loginOrRegisterAzureUser = createAsyncThunk(
  'auth/loginOrRegisterAzureUser',
  async (code, { rejectWithValue }) => {
    clearStorage();
    const url = '/api/auth/loginOrRegisterAzureUser';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          message.error(data.message);
        } else {
          handleError(response);
        }
        // Handle non-2xx responses (e.g., 409 Conflict)
        return rejectWithValue({
          status: response.status,
          message: data.message || 'Azure login failed',
        });
      }

      if (data.success) {
        data.data.isAuthenticated = true;
        setUser(JSON.stringify(data.data));
        return {
          type: 'success',
          user: data.data,
        };
      } else {
        return rejectWithValue({
          status: response.status,
          message: data.message || 'Azure login failed',
        });
      }
    } catch (error) {
      // Handle network errors or other unexpected issues
      return rejectWithValue({
        status: null,
        message: error.message || 'Network error during Azure login',
      });
    }
  }
);

// Sync action for Azure login redirect
export const azureLoginRedirect = () => {
  try {
    const response_type = 'code';
    const response_mode = 'query';
    const redirect_uri = import.meta.env.VITE_AZURE_REDIRECT_URI;
    const scope = 'openid';
    const client_id = import.meta.env.VITE_AZURE_CLIENT_ID;
    const tenant_id = import.meta.env.VITE_AZURE_TENENT_ID;

    window.location.href = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&response_mode=${response_mode}`;
  } catch (e) {
    console.log(e);
    message.error('An error occurred while trying to login with Microsoft.');
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.roles = action.payload.roles;
      state.applications = action.payload.applications;
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.id = action.payload.id;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    loginFailed: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.roles = [];
      state.applications = [];
      state.user = null;
      state.firstName = '';
      state.lastName = '';
      state.id = '';
      state.loading = false;
    },
    logoutSuccess: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.roles = [];
      state.applications = [];
      state.user = null;
      state.firstName = '';
      state.lastName = '';
      state.id = '';
      state.loading = false;
      state.error = null;
    },
    logoutFailed: (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.roles = action.payload.roles;
      state.applications = action.payload.applications;
      state.user = action.payload.user;
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.id = action.payload.id;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.type === Constants.LOGIN_SUCCESS) {
          const user = action.payload.user;
          state.isAuthenticated = true;
          state.token = user.token;
          state.roles = user.roles;
          state.applications = user.applications;
          state.firstName = user.firstName;
          state.lastName = user.lastName;
          state.id = user.id;
          state.user = user;
        } else if (action.payload.type === Constants.LOGIN_FAILED) {
          // Ensure UI sees a non-loading state and an error message
          state.isAuthenticated = false;
          state.token = null;
          state.roles = [];
          state.applications = [];
          state.user = null;
          state.firstName = '';
          state.lastName = '';
          state.id = '';
          state.error = action.payload.error || 'Login failed';
        }
        // For temp-pw, password-expired, unverified cases,
        // the component will handle based on the returned payload
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.isAuthenticated = false;
        state.token = null;
        state.roles = [];
        state.applications = [];
        state.user = null;
        state.firstName = '';
        state.lastName = '';
        state.id = '';
      })

      // logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.roles = [];
        state.applications = [];
        state.user = null;
        state.firstName = '';
        state.lastName = '';
        state.id = '';
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        // Still clear auth state even if API call failed
        state.isAuthenticated = false;
        state.token = null;
        state.roles = [];
        state.applications = [];
        state.user = null;
        state.firstName = '';
        state.lastName = '';
        state.id = '';
      })

      // loadUserFromStorage
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        if (action.payload) {
          const user = action.payload;
          state.isAuthenticated = true;
          state.token = user.token;
          state.roles = user.roles;
          state.applications = user.applications;
          state.firstName = user.firstName;
          state.lastName = user.lastName;
          state.id = user.id;
          state.user = user;
        }
      })

      // registerBasicUser
      .addCase(registerBasicUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerBasicUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerBasicUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // registerOwner
      .addCase(registerOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerOwner.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // loginOrRegisterAzureUser
      .addCase(loginOrRegisterAzureUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginOrRegisterAzureUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.type === Constants.LOGIN_SUCCESS) {
          const user = action.payload.user;
          state.isAuthenticated = true;
          state.token = user.token;
          state.roles = user.roles;
          state.applications = user.applications;
          state.firstName = user.firstName;
          state.lastName = user.lastName;
          state.id = user.id;
          state.user = user;
        }
      })
      .addCase(loginOrRegisterAzureUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
        state.isAuthenticated = false;
        state.token = null;
        state.roles = [];
        state.applications = [];
        state.user = null;
        state.firstName = '';
        state.lastName = '';
        state.id = '';
      });
  },
});

export const { loginSuccess, loginFailed, logoutSuccess, logoutFailed, clearError } = authSlice.actions;

// Export combined actions object (maintains compatibility with existing code)
export const authActions = {
  // Sync actions
  loginSuccess,
  loginFailed,
  logoutSuccess,
  logoutFailed,
  clearError,
  // Async actions
  login,
  logout,
  loadUserFromStorage,
  registerBasicUser,
  registerOwner,
  loginOrRegisterAzureUser,
  // Sync utility
  azureLoginRedirect,
};

export default authSlice.reducer;

// Imports from libraries
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Local imports
import { handleError } from '@/components/common/handleResponse';
import { getUser, setUser } from '@/components/common/userStorage';
import { Constants } from '@/components/common/Constants';
import authService from '@/services/auth.service';
import { resetAuthState } from '@/services/interceptors/auth.interceptor';

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

// Function to clear only auth-related storage
const clearStorage = () => {
  localStorage.removeItem('user');
};

// Async thunks
export const login = createAsyncThunk('auth/login', async ({ email, password, deviceInfo }, { rejectWithValue }) => {
  clearStorage();

  try {
    const response = await authService.loginBasicUser(email, password, deviceInfo);

    // Login success - reset auth interceptor state
    resetAuthState();

    const userData = response.data || response;
    userData.isAuthenticated = true;
    setUser(JSON.stringify(userData));
    return {
      type: Constants.LOGIN_SUCCESS,
      user: userData,
    };
  } catch (err) {
    handleError(err.messages);

    // Extract error message
    const errMessage =
      Array.isArray(err?.messages) && err.messages.length > 0 ? err.messages[0] : err?.message || 'Unknown error';

    // Handle specific authentication states
    if (errMessage === Constants.LOGIN_TEMP_PW) {
      return rejectWithValue({
        type: Constants.LOGIN_TEMP_PW,
        message: errMessage,
      });
    } else if (errMessage === Constants.LOGIN_UNVERIFIED) {
      return rejectWithValue({
        type: Constants.LOGIN_UNVERIFIED,
        message: errMessage,
      });
    } else if (errMessage === Constants.LOGIN_FAILED) {
      return rejectWithValue({
        type: Constants.LOGIN_FAILED,
        message: errMessage,
      });
    } else {
      // Handle any other unexpected errors
      return rejectWithValue({
        type: Constants.LOGIN_FAILED,
        message: errMessage,
      });
    }
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authService.logoutBasicUser();
  } catch {
    // Even if logout API fails, we still want to clear local storage
    // Error logged by interceptor
  }

  clearStorage();
  return null;
});

export const loadUserFromStorage = createAsyncThunk('auth/loadUserFromStorage', async () => {
  const user = getUser();
  return user || null;
});

export const registerBasicUser = createAsyncThunk('auth/registerBasicUser', async values => {
  try {
    const data = await authService.registerBasicUser(values);
    return data;
  } catch (error) {
    handleError(error);
    throw new Error('Registration failed');
  }
});

export const registerOwner = createAsyncThunk('auth/registerOwner', async values => {
  try {
    const data = await authService.registerApplicationOwner(values);
    return data;
  } catch (error) {
    if (error.response) {
      handleError(error.response);
    }
    throw new Error('Owner registration failed');
  }
});

export const loginOrRegisterAzureUser = createAsyncThunk(
  'auth/loginOrRegisterAzureUser',
  async (code, { rejectWithValue }) => {
    clearStorage();

    try {
      const response = await authService.loginOrRegisterAzureUser(code);

      if (response) {
        response.data.isAuthenticated = true;
        setUser(JSON.stringify(response.data));
        return {
          type: 'success',
          user: response.data,
        };
      } else {
        return rejectWithValue({
          status: null,
          message: response.message || 'Azure login failed',
        });
      }
    } catch (error) {
      // Handle axios errors
      if (error.response) {
        const { status, data } = error.response;

        if (status === 409) {
          handleError(data.message);
        } else {
          handleError(error);
        }

        return rejectWithValue({
          status: status,
          message: data.message || 'Azure login failed',
        });
      }
      handleError(error.messages || error);

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
  } catch {
    // Error logged by global error handler
    handleError('An error occurred while trying to login with Microsoft.');
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
    loginFailed: state => {
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
    logoutSuccess: state => {
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
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // login
      .addCase(login.pending, state => {
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
      .addCase(logout.pending, state => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, state => {
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
      .addCase(registerBasicUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerBasicUser.fulfilled, state => {
        state.loading = false;
      })
      .addCase(registerBasicUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // registerOwner
      .addCase(registerOwner.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerOwner.fulfilled, state => {
        state.loading = false;
      })
      .addCase(registerOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // loginOrRegisterAzureUser
      .addCase(loginOrRegisterAzureUser.pending, state => {
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

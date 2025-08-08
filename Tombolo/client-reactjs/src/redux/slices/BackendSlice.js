import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authHeader, handleError } from '@/components/common/AuthHeader';

// Async thunks (replaces old actions/Backend)
// eslint-disable-next-line unused-imports/no-unused-vars
export const checkBackendStatus = createAsyncThunk('backend/checkBackendStatus', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/status', { headers: authHeader() });
    if (!response.ok) {
      // let global handler show message where appropriate
      handleError(response);
      return false;
    }
    return response.ok;
  } catch (err) {
    console.error('Error fetching backend status:', err);
    // swallow network errors as "not connected" rather than throwing
    return false;
  }
});

// eslint-disable-next-line unused-imports/no-unused-vars
export const checkOwnerExists = createAsyncThunk('backend/checkOwnerExists', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('/api/status/ownerExists', { headers: authHeader() });
    if (!response.ok) {
      handleError(response);
      return false;
    }
    const data = await response.json();
    // assume API returns { data: boolean } as before
    return Boolean(data?.data);
  } catch (err) {
    console.error('Error fetching owner exists:', err);
    return false;
  }
});

const initialState = {
  isConnected: false,
  statusRetrieved: false,
  ownerExists: false,
  ownerRetrieved: false,
};

const backendSlice = createSlice({
  name: 'backend',
  initialState,
  reducers: {
    // keep these in case you want to dispatch direct updates
    setBackendStatus: (state, action) => {
      state.isConnected = action.payload;
      state.statusRetrieved = true;
    },
    setUserStatus: (state, action) => {
      state.ownerExists = action.payload;
      state.ownerRetrieved = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkBackendStatus.pending, (state) => {
        // optionally mark statusRetrieved false while checking
        state.statusRetrieved = false;
      })
      .addCase(checkBackendStatus.fulfilled, (state, action) => {
        state.isConnected = action.payload;
        state.statusRetrieved = true;
      })
      .addCase(checkBackendStatus.rejected, (state) => {
        state.isConnected = false;
        state.statusRetrieved = true;
      })

      .addCase(checkOwnerExists.pending, (state) => {
        state.ownerRetrieved = false;
      })
      .addCase(checkOwnerExists.fulfilled, (state, action) => {
        state.ownerExists = action.payload;
        state.ownerRetrieved = true;
      })
      .addCase(checkOwnerExists.rejected, (state) => {
        state.ownerExists = false;
        state.ownerRetrieved = true;
      });
  },
});

export const { setBackendStatus, setUserStatus } = backendSlice.actions;

export default backendSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import statusService from '@/services/status.service';

export interface BackendState {
  isConnected: boolean;
  statusRetrieved: boolean;
  ownerExists: boolean;
  ownerRetrieved: boolean;
}

const initialState: BackendState = {
  isConnected: false,
  statusRetrieved: false,
  ownerExists: false,
  ownerRetrieved: false,
};

// Async thunks (replaces old actions/Backend)
export const checkBackendStatus = createAsyncThunk<boolean, void>('backend/checkBackendStatus', async () => {
  try {
    await statusService.checkBackendStatus();
    return true;
  } catch (err) {
    // swallow network errors as "not connected"
    console.error('Error fetching backend status:', err);
    return false;
  }
});

export const checkOwnerExists = createAsyncThunk<boolean, void>('backend/checkOwnerExists', async () => {
  try {
    const response = await statusService.checkOwnerExists();
    return Boolean(response);
  } catch (err) {
    console.error('Error fetching owner exists:', err);
    return false;
  }
});

const backendSlice = createSlice({
  name: 'backend',
  initialState,
  reducers: {
    setBackendStatus(state, action: { payload: boolean }) {
      state.isConnected = action.payload;
      state.statusRetrieved = true;
    },
    setUserStatus(state, action: { payload: boolean }) {
      state.ownerExists = action.payload;
      state.ownerRetrieved = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(checkBackendStatus.pending, state => {
        state.statusRetrieved = false;
      })
      .addCase(checkBackendStatus.fulfilled, (state, action) => {
        state.isConnected = action.payload;
        state.statusRetrieved = true;
      })
      .addCase(checkBackendStatus.rejected, state => {
        state.isConnected = false;
        state.statusRetrieved = true;
      })

      .addCase(checkOwnerExists.pending, state => {
        state.ownerRetrieved = false;
      })
      .addCase(checkOwnerExists.fulfilled, (state, action) => {
        state.ownerExists = action.payload;
        state.ownerRetrieved = true;
      })
      .addCase(checkOwnerExists.rejected, state => {
        state.ownerExists = false;
        state.ownerRetrieved = true;
      });
  },
});

export const { setBackendStatus, setUserStatus } = backendSlice.actions;

export default backendSlice.reducer;

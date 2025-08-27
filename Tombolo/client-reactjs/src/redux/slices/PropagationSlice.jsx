import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authHeader } from '@/components/common/AuthHeader';
import { notification, message, Typography } from 'antd';

/**
 * Thunks:
 * - generateChangesReport: POST /api/propagation/:applicationId
 * - generateCurrentReport: GET /api/report/read/generate_current/:applicationId (optionally ?baseLineId=)
 * - getReports: fetch `/api/report/read/:applicationId`
 *
 * Components can dispatch these thunks and optionally await them:
 *   await dispatch(generateChangesReport({ history }));
 *   await dispatch(getReports({ callFrom: 'changes' }));
 */

/* Helpers to get applicationId from state */
const selectApplicationId = (getState) => getState().application?.application?.applicationId || null;

const generateChangesReport = createAsyncThunk(
  'propagation/generateChangesReport',
  async ({ history, baseLineId = null } = {}, { getState, rejectWithValue }) => {
    try {
      const applicationId = selectApplicationId(getState);
      if (!applicationId) throw new Error('No application selected');

      let url = `/api/propagation/${applicationId}`;
      if (baseLineId) url += `/?baseLineId=${baseLineId}`;

      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();

      // Show notification and navigate when user clicks link
      const goToReport = () => {
        notification.close('report');
        if (history) history.push(`/admin/compliance/changes`);
      };

      notification.success({
        key: 'report',
        duration: 0,
        placement: 'top',
        message: 'Report is ready!',
        description: (
          <>
            <Typography>Report is available under Compliance tab on the left blade</Typography>
            {history && !history.location.pathname.includes('/admin/compliance') ? (
              <Typography.Link onClick={goToReport}>Click here to go to report!</Typography.Link>
            ) : null}
          </>
        ),
      });

      return data;
    } catch (err) {
      message.error(err.message);
      return rejectWithValue(err.message);
    }
  }
);

const generateCurrentReport = createAsyncThunk(
  'propagation/generateCurrentReport',
  async ({ history, baseLineId = null } = {}, { getState, rejectWithValue }) => {
    try {
      const applicationId = selectApplicationId(getState);
      if (!applicationId) throw new Error('No application selected');

      let url = `/api/report/read/generate_current/${applicationId}`;
      if (baseLineId) url += `/?baseLineId=${baseLineId}`;

      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();

      const goToReport = () => {
        notification.close('report');
        if (history) history.push(`/admin/compliance/current`);
      };

      notification.success({
        key: 'report',
        duration: 0,
        placement: 'top',
        message: 'Report is ready!',
        description: (
          <>
            <Typography>Report is available under Compliance tab on the left blade</Typography>
            {history && !history.location.pathname.includes('/admin/compliance') ? (
              <Typography.Link onClick={goToReport}>Click here to go to report!</Typography.Link>
            ) : null}
          </>
        ),
      });

      return data;
    } catch (err) {
      message.error(err.message);
      return rejectWithValue(err.message);
    }
  }
);

const getReports = createAsyncThunk(
  'propagation/getReports',
  async ({ callFrom } = {}, { getState, rejectWithValue }) => {
    try {
      const applicationId = selectApplicationId(getState);
      if (!applicationId) throw new Error('No application selected');

      const response = await fetch(`/api/report/read/${applicationId}`, { headers: authHeader() });
      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      return { data, callFrom };
    } catch (err) {
      message.error(err.message);
      return rejectWithValue({ message: err.message, callFrom });
    }
  }
);

const initialState = {
  changes: { error: '', loading: false },
  current: { error: '', loading: false },
  reports: [],
  loading: false,
};

const propagationSlice = createSlice({
  name: 'propagation',
  initialState,
  reducers: {
    propagationsChangesInitiate: (state) => {
      state.changes = { error: '', loading: true };
    },
    propagationsChangesSuccess: (state, action) => {
      state.changes = { loading: false };
      state.reports = [action.payload, ...state.reports];
    },
    propagationsChangesError: (state, action) => {
      state.changes = { error: action.payload, loading: false };
    },
    propagationsCurrentInitiate: (state) => {
      state.current = { error: '', loading: true };
    },
    propagationsCurrentSuccess: (state, action) => {
      state.current = { loading: false };
      state.reports = [action.payload, ...state.reports];
    },
    propagationsCurrentError: (state, action) => {
      state.current = { error: action.payload, loading: false };
    },
    updateReports: (state, action) => {
      state.loading = false;
      state.reports = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // generateChangesReport lifecycle
      .addCase(generateChangesReport.pending, (state) => {
        state.changes = { error: '', loading: true };
      })
      .addCase(generateChangesReport.fulfilled, (state, action) => {
        state.changes = { loading: false };
        state.reports = [action.payload, ...state.reports];
      })
      .addCase(generateChangesReport.rejected, (state, action) => {
        state.changes = { error: action.payload || action.error.message, loading: false };
      })

      // generateCurrentReport lifecycle
      .addCase(generateCurrentReport.pending, (state) => {
        state.current = { error: '', loading: true };
      })
      .addCase(generateCurrentReport.fulfilled, (state, action) => {
        state.current = { loading: false };
        state.reports = [action.payload, ...state.reports];
      })
      .addCase(generateCurrentReport.rejected, (state, action) => {
        state.current = { error: action.payload || action.error.message, loading: false };
      })

      // getReports lifecycle
      .addCase(getReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(getReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.data;
      })
      .addCase(getReports.rejected, (state, action) => {
        state.loading = false;
        // set relevant error based on callFrom if provided
        const callFrom = action.payload?.callFrom;
        const err = action.payload?.message || action.error.message;
        if (callFrom === 'changes') {
          state.changes = { error: err, loading: false };
        } else if (callFrom === 'current') {
          state.current = { error: err, loading: false };
        } else {
          // generic error slot
          state.changes = { error: err, loading: false };
          state.current = { error: err, loading: false };
        }
      });
  },
});

export const {
  propagationsChangesInitiate,
  propagationsChangesSuccess,
  propagationsChangesError,
  propagationsCurrentInitiate,
  propagationsCurrentSuccess,
  propagationsCurrentError,
  updateReports,
} = propagationSlice.actions;

export { generateChangesReport, generateCurrentReport, getReports };

export default propagationSlice.reducer;

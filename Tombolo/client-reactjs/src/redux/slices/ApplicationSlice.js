import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import integrationsService from '@/services/integrations.service.js';
import applicationsService from '@/services/applications.service';
import clustersService from '@/services/clusters.service';

const initialState = {
  application: {},
  applications: [],
  applicationsRetrieved: false,
  noApplication: { firstTourShown: false, addButtonTourShown: false, noApplication: false },
  noClusters: { firstTourShown: false, addButtonTourShown: false, noClusters: false },
  clusters: [],
  integrations: [],
};

// Async thunks
export const getClusters = createAsyncThunk('application/getClusters', async (_, { dispatch }) => {
  const clusters = await clustersService.getAll();

  // If there are no clusters, set this to null for later checks
  if (clusters.length === 0) {
    dispatch(noClustersFound(true));
    return null;
  }

  return clusters;
});

export const getApplications = createAsyncThunk('application/getApplications', async (_, { dispatch }) => {
  const applications = await applicationsService.getAll();

  if (!applications || applications.length === 0) {
    dispatch(noApplicationFound(true));
    dispatch(applicationSelected({ applicationId: null, applicationTitle: null }));
    return [];
  }

  return applications;
});

export const getAllActiveIntegrations = createAsyncThunk('application/getAllActiveIntegrations', async () => {
  // const response = await fetch('/api/integrations/getAllActive', { headers: authHeader() });
  const data = await integrationsService.getAllActive();
  // if (!response.ok) throw await handleError(response);

  const integrations = [];

  if (data.length > 0) {
    data.forEach((d) => {
      integrations.push({
        name: d.integration.name,
        integration_id: d.integration_id,
        application_id: d.application_id,
        integration_to_app_mapping_id: d.id,
      });
    });
  }

  return integrations;
});

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    applicationSelected: (state, action) => {
      state.application = action.payload;
    },
    applicationsRetrieved: (state, action) => {
      state.applications = action.payload;
      state.applicationsRetrieved = true;
    },
    noApplicationFound: (state, action) => {
      state.noApplication.noApplication = action.payload;
    },
    applicationLeftTourShown: (state, action) => {
      state.noApplication.firstTourShown = action.payload;
    },
    applicationAddButtonTourShown: (state, action) => {
      state.noApplication.addButtonTourShown = action.payload;
    },
    noClustersFound: (state, action) => {
      state.noClusters.noClusters = action.payload;
    },
    clustersLeftTourShown: (state, action) => {
      state.noClusters.firstTourShown = action.payload;
    },
    clustersAddButtonTourShown: (state, action) => {
      state.noClusters.addButtonTourShown = action.payload;
    },
    clustersFound: (state, action) => {
      state.clusters = action.payload;
    },
    integrationsRetrieved: (state, action) => {
      state.integrations = action.payload;
    },
    updateIntegrations: (state, action) => {
      state.integrations = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // getClusters
      .addCase(getClusters.fulfilled, (state, action) => {
        if (action.payload) {
          state.clusters = action.payload;
        }
      })
      .addCase(getClusters.rejected, (_state, _action) => {
        // Error handled by global error interceptor
      })

      // getApplications
      .addCase(getApplications.fulfilled, (state, action) => {
        state.applications = action.payload;
        state.applicationsRetrieved = true;
      })
      .addCase(getApplications.rejected, (state, _action) => {
        state.noApplication.noApplication = true;
        state.applications = [];
        state.application = { applicationId: null, applicationTitle: null };
      })

      // getAllActiveIntegrations
      .addCase(getAllActiveIntegrations.fulfilled, (state, action) => {
        state.integrations = action.payload;
      })
      .addCase(getAllActiveIntegrations.rejected, (_state, _action) => {
        // Error handled by global error interceptor
      });
  },
});

export const {
  applicationSelected,
  applicationsRetrieved,
  noApplicationFound,
  applicationLeftTourShown,
  applicationAddButtonTourShown,
  noClustersFound,
  clustersLeftTourShown,
  clustersAddButtonTourShown,
  clustersFound,
  integrationsRetrieved,
  updateIntegrations,
} = applicationSlice.actions;

// Export combined actions object (maintains compatibility with existing code)
export const applicationActions = {
  // Sync actions
  applicationSelected,
  applicationsRetrieved,
  noApplicationFound,
  applicationLeftTourShown,
  applicationAddButtonTourShown,
  noClustersFound,
  clustersLeftTourShown,
  clustersAddButtonTourShown,
  clustersFound,
  integrationsRetrieved,
  updateIntegrations,
  // Async actions
  getClusters,
  getApplications,
  getAllActiveIntegrations,
  // Aliases for backward compatibility
  updateApplicationAddButtonTourShown: applicationAddButtonTourShown,
  updateApplicationLeftTourShown: applicationLeftTourShown,
  updateNoApplicationFound: noApplicationFound,
  updateNoClustersFound: noClustersFound,
  updateClustersAddButtonTourShown: clustersAddButtonTourShown,
  updateClustersLeftTourShown: clustersLeftTourShown,
  updateClusters: clustersFound,
};

export default applicationSlice.reducer;

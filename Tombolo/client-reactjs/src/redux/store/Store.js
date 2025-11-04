import { configureStore } from '@reduxjs/toolkit';
import applicationReducer from '../slices/ApplicationSlice';
import assetReducer from '../slices/AssetSlice';
import authReducer from '../slices/AuthSlice';
import backendReducer from '../slices/BackendSlice';
import dataflowReducer from '../slices/DataflowSlice';
// import groupsReducer from '../slices/GroupSlice';
// import propagationReducer from '../slices/PropagationSlice';

export const store = configureStore({
  reducer: {
    application: applicationReducer,
    asset: assetReducer,
    auth: authReducer,
    backend: backendReducer,
    dataflow: dataflowReducer,
    // groups: groupsReducer,
    // propagation: propagationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // You can customize middleware here if needed
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

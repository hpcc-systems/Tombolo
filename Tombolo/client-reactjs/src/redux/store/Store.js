import { configureStore } from '@reduxjs/toolkit';
import applicationReducer from '../slices/applicationSlice';
import assetReducer from '../slices/assetSlice';
import authReducer from '../slices/authSlice';
import backendReducer from '../slices/backendSlice';
import dataflowReducer from '../slices/dataflowSlice';
import groupsReducer from '../slices/groupSlice';
import propagationReducer from '../slices/PropagationSlice';

export const store = configureStore({
  reducer: {
    application: applicationReducer,
    asset: assetReducer,
    auth: authReducer,
    backend: backendReducer,
    dataflow: dataflowReducer,
    groups: groupsReducer,
    propagation: propagationReducer,
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

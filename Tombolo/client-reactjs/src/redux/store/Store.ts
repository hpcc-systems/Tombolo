import { configureStore } from '@reduxjs/toolkit';
import applicationReducer from '../slices/ApplicationSlice';
import assetReducer from '../slices/AssetSlice';
import authReducer from '../slices/AuthSlice';
import backendReducer from '../slices/BackendSlice';

export const store = configureStore({
  reducer: {
    application: applicationReducer,
    asset: assetReducer,
    auth: authReducer,
    backend: backendReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;

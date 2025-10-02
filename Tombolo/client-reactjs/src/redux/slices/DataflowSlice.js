import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: '',
  title: '',
  version: '', // TODO: currently version is not in use
  clusterId: '',
};

const dataflowSlice = createSlice({
  name: 'dataflow',
  initialState,
  reducers: {
    dataflowSelected: (state, action) => {
      // Replace the entire state with the payload
      return { ...action.payload };
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
    dataflowReset: (state) => {
      // Reset to the initial state
      return { ...initialState };
    },
  },
});

export const { dataflowSelected, dataflowReset } = dataflowSlice.actions;

export default dataflowSlice.reducer;

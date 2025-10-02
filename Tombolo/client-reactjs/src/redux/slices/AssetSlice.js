import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedAsset: { id: '', applicationId: '', title: '' },
  newAsset: { groupId: '', applicationId: '', isNew: false },
  searchParams: { assetTypeFilter: '', keywords: '' },
  assetInGroupId: '',
  clusterId: '',
  saveResponse: null,
};

const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {
    assetSelected: (state, action) => {
      state.selectedAsset = {
        id: action.payload.id,
        applicationId: action.payload.applicationId,
        title: action.payload.title,
      };
      state.newAsset = {
        groupId: '',
        applicationId: '',
        isNew: false,
      };
    },
    newAsset: (state, action) => {
      state.selectedAsset = {
        id: '',
        applicationId: '',
        title: '',
        isNew: true,
      };
      state.newAsset = {
        groupId: action.payload.groupId,
        applicationId: action.payload.applicationId,
        isNew: action.payload.isNew,
      };
    },
    searchAsset: (state, action) => {
      state.searchParams = action.payload;
    },
    assetInGroupSelected: (state, action) => {
      state.assetInGroupId = action.payload;
    },
    clusterSelected: (state, action) => {
      state.clusterId = action.payload;
    },
    assetSaved: (state, action) => {
      state.saveResponse = action.payload;
    },
  },
});

export const { assetSelected, newAsset, searchAsset, assetInGroupSelected, clusterSelected, assetSaved } =
  assetSlice.actions;

export default assetSlice.reducer;

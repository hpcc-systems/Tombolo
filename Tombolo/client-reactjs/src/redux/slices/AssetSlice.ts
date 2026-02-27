import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SelectedAsset {
  id: string;
  applicationId: string;
  title: string;
  isNew?: boolean;
}

export interface NewAsset {
  groupId: string;
  applicationId: string;
  isNew: boolean;
}

export interface SearchParams {
  assetTypeFilter: string;
  keywords: string;
}

export interface AssetState {
  selectedAsset: SelectedAsset;
  newAsset: NewAsset;
  searchParams: SearchParams;
  assetInGroupId: string;
  clusterId: string;
  saveResponse: any | null;
}

const initialState: AssetState = {
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
    assetSelected: (state, action: PayloadAction<SelectedAsset>) => {
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
    newAsset: (state, action: PayloadAction<NewAsset>) => {
      state.selectedAsset = {
        id: '',
        applicationId: '',
        title: '',
        isNew: true,
      } as SelectedAsset;
      state.newAsset = {
        groupId: action.payload.groupId,
        applicationId: action.payload.applicationId,
        isNew: action.payload.isNew,
      };
    },
    searchAsset: (state, action: PayloadAction<SearchParams>) => {
      state.searchParams = action.payload;
    },
    assetInGroupSelected: (state, action: PayloadAction<string>) => {
      state.assetInGroupId = action.payload;
    },
    clusterSelected: (state, action: PayloadAction<string>) => {
      state.clusterId = action.payload;
    },
    assetSaved: (state, action: PayloadAction<any>) => {
      state.saveResponse = action.payload;
    },
  },
});

export const { assetSelected, newAsset, searchAsset, assetInGroupSelected, clusterSelected, assetSaved } =
  assetSlice.actions;

export default assetSlice.reducer;

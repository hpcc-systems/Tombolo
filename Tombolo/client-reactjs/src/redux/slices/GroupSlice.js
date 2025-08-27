// JavaScript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { message } from 'antd';
import { authHeader, handleError } from '../../components/common/AuthHeader';

// Async thunk to fetch groups tree (replaces old actions.getGroupsTree)
export const getGroupsTree = createAsyncThunk('groups/getGroupsTree', async (applicationId, { rejectWithValue }) => {
  try {
    const url = '/api/groups?app_id=' + applicationId;
    const response = await fetch(url, { headers: authHeader() });
    if (!response.ok) {
      handleError(response);
      return rejectWithValue('Failed to fetch groups');
    }
    const tree = await response.json();

    // generate flat dataList from tree
    const generateList = (data, parentKey = '', parentId = '', list = []) => {
      for (let i = 0; i < data.length; i++) {
        const { key, title, id, children } = data[i];
        list.push({ key, title, id, parentKey, parentId });
        if (children) {
          generateList(children, key, id, list);
        }
      }
      return list;
    };

    const dataList = generateList(tree);
    return { tree, dataList };
  } catch (err) {
    message.error(err.message);
    return rejectWithValue(err.message);
  }
});

const initialState = {
  error: '',
  loading: false,
  tree: [],
  dataList: [],
  expandedKeys: ['0-0'],
  selectedKeys: { id: '', key: '0-0' },
};

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    groupsExpanded: (state, action) => {
      state.expandedKeys = action.payload;
    },
    selectGroup: (state, action) => {
      state.selectedKeys = action.payload;
    },
    fetchGroupsTree: (state) => {
      state.loading = true;
      state.error = '';
    },
    fetchGroupsTreeSuccess: (state, action) => {
      state.loading = false;
      state.tree = action.payload.tree;
      state.dataList = action.payload.dataList;
    },
    fetchGroupsTreeError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    // eslint-disable-next-line unused-imports/no-unused-vars
    emptyGroupsTree: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGroupsTree.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(getGroupsTree.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = action.payload.tree;
        state.dataList = action.payload.dataList;
      })
      .addCase(getGroupsTree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  groupsExpanded,
  selectGroup,
  fetchGroupsTree,
  fetchGroupsTreeSuccess,
  fetchGroupsTreeError,
  emptyGroupsTree,
} = groupsSlice.actions;

export default groupsSlice.reducer;

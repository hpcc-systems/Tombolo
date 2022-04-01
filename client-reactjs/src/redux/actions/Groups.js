import { message } from 'antd';
import { authHeader, handleError } from '../../components/common/AuthHeader';
import { Constants } from '../../components/common/Constants';

export const expandGroups = (expandedKeys) => {
  return {
    type: Constants.GROUPS_EXPANDED,
    payload: expandedKeys
  };
}

export const selectGroup = (selectedKeys) => {
  return {
    type: Constants.SELECT_GROUP,
    payload: selectedKeys
  };
}

export const getGroupsTree = (applicationId) => {
  return async (dispatch) => {
    try {
      dispatch(fetchGroupsTree());
      const url = '/api/groups?app_id=' + applicationId;
      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) handleError(response);

      const tree = await response.json();

      const dataList = generateList(tree);
      
      dispatch(fetchGroupsTreeSuccess({ tree, dataList}));
    } catch (error) {
      message.error(error.message)
      dispatch(fetchGroupsTreeFailure(error.message));
    }
  };
};

const fetchGroupsTree = () => {
  return {
    type: Constants.FETCH_GROUPS_TREE,
  };
};

const fetchGroupsTreeSuccess = ({tree, dataList}) => {
  return {
    type: Constants.FETCH_GROUPS_TREE_SUCCESS,
    payload: {tree, dataList},
  };
};

const fetchGroupsTreeFailure = (error) => {
  return {
    type: Constants.FETCH_GROUPS_TREE_ERROR,
    payload: error,
  };
};


const generateList = (data, parentKey="", parentId='', list=[]) => {
  for (let i = 0; i < data.length; i++) {
    const { key, title, id, children } = data[i];
    list.push({ key, title, id, parentKey, parentId });
    if (children) {
      generateList(children, key, id, list);
    }
  }
  return list;
};
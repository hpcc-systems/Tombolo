import { Constants } from '../../components/common/Constants';

export const groupsActions = {
  groupExpanded
};

function groupExpanded(selectedKeys, expandedKeys) {
  return dispatch => {
    dispatch(request({ selectedKeys, expandedKeys }));
  };
  function request(keys) {
    return {
      type: Constants.GROUPS_EXPANDED,
      keys
    }
  }
}
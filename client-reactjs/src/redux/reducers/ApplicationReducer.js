import { Constants } from '../../components/common/Constants';

const initialState = {};

export function applicationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.APPLICATION_SELECTED:
      return {
        application: action.application
      };
    case Constants.TOP_NAV_CHANGED:
      return {
        selectedTopNav: action.selectedTopNav
      };
    default:
      return state
  }
}
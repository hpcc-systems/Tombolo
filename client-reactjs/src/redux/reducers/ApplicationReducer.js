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
    case Constants.NEW_APPLICATION_ADDED:
      return {
        newApplication: action.newApplication
      };  
    case Constants.APPLICATION_UPDATED:
      return {
        updatedApplication: action.updatedApplication
      };  
    case Constants.APPLICATION_DELETED:
      return {
        deletedApplicationId: action.applicationId
      };        
    default:
      return state
  }
}
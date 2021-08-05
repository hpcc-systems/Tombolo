import { Constants } from '../../components/common/Constants';

const initialState = {application:{}, selectedTopNav:'', newApplication:'', updatedApplication:'', deletedApplicationId:'', clusters:[], consumers:[]};

export function applicationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.APPLICATION_SELECTED:
      return {
        ...state,
        application: action.application
      };
    case Constants.TOP_NAV_CHANGED:
      return {
        ...state,
        selectedTopNav: action.selectedTopNav
      };
    case Constants.NEW_APPLICATION_ADDED:
      return {
        ...state,
        deletedApplicationId: '',
        updatedApplication: '',
        newApplication: action.newApplication
      };
    case Constants.APPLICATION_UPDATED:
      return {
        ...state,
        newApplication: '',
        deletedApplicationId: '',
        updatedApplication: action.updatedApplication
      };
    case Constants.APPLICATION_DELETED:
      return {
        ...state,
        newApplication: '',
        updatedApplication: '',      
        deletedApplicationId: action.applicationId
      };
    case Constants.CLUSTERS_RETRIEVED:
      return {
        ...state,
        clusters: action.clusters
      };
    case Constants.CONSUMERS_RETRIEVED:
      return {
        ...state,
        consumers: action.consumers
      };
    default:
      return state
  }
}
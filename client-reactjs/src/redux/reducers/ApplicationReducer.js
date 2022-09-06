import { Constants } from '../../components/common/Constants';

const initialState = {
  application: {},
  newApplication: '',
  updatedApplication: '',
  deletedApplicationId: '',
  clusters: [],
  consumers: [],
  licenses: [],
  constraints: [],
};

export function applicationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.APPLICATION_SELECTED:
      return {
        ...state,
        application: action.application,
      };
    case Constants.NEW_APPLICATION_ADDED:
      return {
        ...state,
        deletedApplicationId: '',
        updatedApplication: '',
        newApplication: action.newApplication,
      };
    case Constants.APPLICATION_UPDATED:
      return {
        ...state,
        newApplication: '',
        deletedApplicationId: '',
        updatedApplication: action.updatedApplication,
      };
    case Constants.APPLICATION_DELETED:
      return {
        ...state,
        newApplication: '',
        updatedApplication: '',
        deletedApplicationId: action.applicationId,
      };
    case Constants.CLUSTERS_RETRIEVED:
      return {
        ...state,
        clusters: action.clusters,
      };
    case Constants.CONSUMERS_RETRIEVED:
      return {
        ...state,
        consumers: action.consumers,
      };
    case Constants.LICENSES_RETRIEVED:
      return {
        ...state,
        licenses: action.licenses,
      };
    case Constants.CONSTRAINTS_RETRIEVED:
      return {
        ...state,
        constraints: action.constraints,
      };
    case Constants.UPDATE_CONSTRAINTS:
      return {
        ...state,
        constraints: action.constraints,
      };
    default:
      return state;
  }
}

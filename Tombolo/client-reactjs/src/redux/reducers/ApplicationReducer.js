import { Constants } from '../../components/common/Constants';

const initialState = {
  application: {},
  noApplication: { firstTourShown: false, addButtonTourShown: false, noApplication: false },
  noClusters: { firstTourShown: false, addButtonTourShown: false, noClusters: false },
  newApplication: '',
  updatedApplication: '',
  deletedApplicationId: '',
  clusters: [],
  consumers: [],
  licenses: [],
  constraints: [],
  integrations: [],
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
      // eslint-disable-next-line no-case-declarations
      const currentApplication = action.applicationId === state.application?.applicationId ? {} : state.application;
      return {
        ...state,
        newApplication: '',
        updatedApplication: '',
        application: currentApplication,
        deletedApplicationId: action.applicationId,
      };
    case Constants.NO_APPLICATION_FOUND:
      return {
        ...state,
        noApplication: { ...state.noApplication, noApplication: true },
      };

    case Constants.APPLICATION_LEFT_TOUR_SHOWN:
      return {
        ...state,
        noApplication: { ...state.noApplication, firstTourShown: true },
      };
    case Constants.APPLICATION_ADD_BUTTON_TOUR_SHOWN:
      return {
        ...state,
        noApplication: { ...state.noApplication, addButtonTourShown: true },
      };

    case Constants.NO_CLUSTERS_FOUND:
      return {
        ...state,
        noClusters: { ...state.noClusters, noClusters: true },
      };

    case Constants.CLUSTERS_LEFT_TOUR_SHOWN:
      return {
        ...state,
        noClusters: { ...state.noClusters, firstTourShown: true },
      };
    case Constants.CLUSTERS_ADD_BUTTON_TOUR_SHOWN:
      return {
        ...state,
        noClusters: { ...state.noClusters, addButtonTourShown: true },
      };

    case Constants.CLUSTERS_FOUND:
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
    case Constants.INTEGRATIONS_RETRIEVED:
      return {
        ...state,
        integrations: action.integrations,
      };
    case Constants.UPDATE_INTEGRATIONS:
      return {
        ...state,
        integrations: action.integrations,
      };

    default:
      return state;
  }
}

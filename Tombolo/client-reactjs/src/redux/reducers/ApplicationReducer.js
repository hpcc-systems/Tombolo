import { Constants } from '../../components/common/Constants';

const initialState = {
  application: {},
  applications: [],
  applicationsRetrieved: false,
  noApplication: { firstTourShown: false, addButtonTourShown: false, noApplication: false },
  noClusters: { firstTourShown: false, addButtonTourShown: false, noClusters: false },
  clusters: [],
  integrations: [],
};

export function applicationReducer(state = initialState, action) {
  switch (action.type) {
    case Constants.APPLICATION_SELECTED:
      return {
        ...state,
        application: action.application,
      };
    case Constants.APPLICATIONS_RETRIEVED:
      return {
        ...state,
        applications: action.payload,
        applicationsRetrieved: true,
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

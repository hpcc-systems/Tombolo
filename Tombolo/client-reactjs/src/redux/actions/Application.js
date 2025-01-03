import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader.js';
import { getUser } from '../../components/common/userStorage.js';

export const applicationActions = {
  applicationSelected,
  getClusters,
  getApplications,
  getAllActiveIntegrations,
  updateApplicationAddButtonTourShown,
  updateApplicationLeftTourShown,
  updateNoApplicationFound,
  updateNoClustersFound,
  updateClustersAddButtonTourShown,
  updateClustersLeftTourShown,
  updateClusters,
};

function applicationSelected(applicationId, applicationTitle) {
  return {
    type: Constants.APPLICATION_SELECTED,
    application: { applicationId, applicationTitle },
  };
}
function updateNoApplicationFound(noApplication) {
  return { type: Constants.NO_APPLICATION_FOUND, noApplication };
}

function updateApplicationLeftTourShown(shown) {
  return { type: Constants.APPLICATION_LEFT_TOUR_SHOWN, shown };
}

function updateApplicationAddButtonTourShown(shown) {
  return { type: Constants.APPLICATION_ADD_BUTTON_TOUR_SHOWN, shown };
}

function getClusters() {
  return (dispatch) => {
    fetch('/api/cluster', { headers: authHeader() })
      .then((response) => (response.ok ? response.json() : handleError(response)))
      .then((clusters) => {
        //if there are no clusters, set this to null for later checks
        if (clusters.data.length === 0) {
          dispatch({ type: Constants.NO_CLUSTERS_FOUND, noClusters: true });
          return;
        }

        dispatch({ type: Constants.CLUSTERS_FOUND, clusters: clusters.data });
      })
      .catch(console.log);
  };
}

function updateClusters(clusters) {
  return { type: Constants.CLUSTERS_FOUND, clusters };
}

function updateNoClustersFound(noClusters) {
  return { type: Constants.NO_CLUSTERS_FOUND, noClusters };
}

function updateClustersLeftTourShown(shown) {
  return { type: Constants.CLUSTERS_LEFT_TOUR_SHOWN, shown };
}

function updateClustersAddButtonTourShown(shown) {
  return { type: Constants.CLUSTERS_ADD_BUTTON_TOUR_SHOWN, shown };
}

// Get  all active Integrations aka integrations that are in the integrations to application mapping table
function getAllActiveIntegrations() {
  return (dispatch) => {
    fetch('/api/integrations/getAllActive', { headers: authHeader() })
      .then((response) => {
        if (!response.ok) {
          throw handleError(response);
        }
        return response.json();
      })
      .then((data) => {
        const integrations = [];
        if (data.length > 0) {
          data.forEach((d) => {
            integrations.push({
              name: d.integration.name,
              integration_id: d.integration_id,
              application_id: d.application_id,
              integration_to_app_mapping_id: d.id,
            });
          });
        }
        dispatch({ type: Constants.INTEGRATIONS_RETRIEVED, integrations });
      })
      .catch((error) => {
        console.log(error);
      });
  };
}

function getApplications() {
  return (dispatch) => {
    fetch('/api/app/read/app_list', { headers: authHeader() })
      .then((response) => (response.ok ? response.json() : handleError(response)))
      .then((applications) => {
        let applicationsFinal = applications ? applications : [];

        //filter out applications by what user has access too in local storage
        const user = getUser();
        const userApplications = user.applications;

        if (userApplications) {
          const userApplicationIds = userApplications.map((app) => app.application.id);
          applicationsFinal = applicationsFinal.filter((app) => userApplicationIds.includes(app.id));
        }

        if (applicationsFinal.length === 0) {
          dispatch({ type: Constants.NO_APPLICATION_FOUND, noApplication: true });
          dispatch({ type: Constants.APPLICATIONS_RETRIEVED, payload: applicationsFinal });
          dispatch({
            type: Constants.APPLICATION_SELECTED,
            application: { applicationId: null, applicationTitle: null },
          });
          return;
        }
        dispatch({ type: Constants.APPLICATIONS_RETRIEVED, payload: applicationsFinal });
      })
      .catch(console.log);
  };
}

import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader.js';

export const applicationActions = {
  applicationSelected,
  newApplicationAdded,
  applicationUpdated,
  applicationDeleted,
  getClusters,
  getConsumers,
  getLicenses,
  getConstraints,
  updateConstraints,
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

function newApplicationAdded(applicationId, applicationTitle) {
  return {
    type: Constants.NEW_APPLICATION_ADDED,
    newApplication: { applicationId, applicationTitle },
  };
}

function applicationUpdated(applicationId, applicationTitle) {
  return {
    type: Constants.APPLICATION_UPDATED,
    updatedApplication: { applicationId, applicationTitle },
  };
}

function applicationDeleted(applicationId) {
  return {
    type: Constants.APPLICATION_DELETED,
    applicationId,
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
    fetch('/api/hpcc/read/getClusters', { headers: authHeader() })
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

function getConsumers() {
  return (dispatch) => {
    fetch('/api/consumer/consumers', { headers: authHeader() })
      .then((response) => (response.ok ? response.json() : handleError(response)))
      .then((consumers) => dispatch({ type: Constants.CONSUMERS_RETRIEVED, consumers }))
      .catch(console.log);
  };
}

function getLicenses() {
  return (dispatch) => {
    fetch('/api/file/read/licenses', { headers: authHeader() })
      .then((response) => (response.ok ? response.json() : handleError(response)))
      .then((licenses) => dispatch({ type: Constants.LICENSES_RETRIEVED, licenses }))
      .catch(console.log);
  };
}

function getConstraints() {
  return (dispatch) => {
    fetch('/api/constraint', { headers: authHeader() })
      .then((response) => (response.ok ? response.json() : handleError(response)))
      .then((constraints) => dispatch({ type: Constants.CONSTRAINTS_RETRIEVED, constraints }))
      .catch(console.log);
  };
}

function updateConstraints(constraints) {
  return { type: Constants.UPDATE_CONSTRAINTS, constraints };
}

// function getIntegrations(applicationId) {
//   return (dispatch) => {
//     fetch(`/api/integrations/get/${applicationId}`, { headers: authHeader() })
//       .then((response) => (response.ok ? response.json() : handleError(response)))
//       .then((integrations) => dispatch({ type: Constants.INTEGRATIONS_RETRIEVED, integrations }))
//       .catch(console.log);
//   };
// }

// Get  all active Integrations aka integrations that are in the integrations to application mapping table
function getAllActiveIntegrations() {
  return async (dispatch) => {
    try {
      const response = await fetch('/api/integrations/getAllActive', { headers: authHeader() });

      if (!response.ok) {
        throw handleError(response);
      }

      const data = await response.json();
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
    } catch (error) {
      console.log(error);
    }
  };
}

// function updateIntegrations(integrations) {
//   return { type: Constants.UPDATE_INTEGRATIONS, integrations };
// }

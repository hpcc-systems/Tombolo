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

function getClusters() {
  return (dispatch) => {
    fetch('/api/hpcc/read/getClusters', { headers: authHeader() })
      .then((response) => (response.ok ? response.json() : handleError(response)))
      .then((clusters) => dispatch({ type: Constants.CLUSTERS_RETRIEVED, clusters }))
      .catch(console.log);
  };
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

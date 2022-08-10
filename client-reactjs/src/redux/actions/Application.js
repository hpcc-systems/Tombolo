import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader.js';

export const applicationActions = {
  applicationSelected,
  newApplicationAdded,
  applicationUpdated,
  applicationDeleted,
  topNavChanged,
  getClusters,
  getConsumers,
};

function applicationSelected(applicationId, applicationTitle) {
  return (dispatch) => {
    dispatch(request({ applicationId, applicationTitle }));
  };
  function request(application) {
    return {
      type: Constants.APPLICATION_SELECTED,
      application,
    };
  }
}

function newApplicationAdded(applicationId, applicationTitle) {
  return (dispatch) => {
    dispatch(request({ applicationId, applicationTitle }));
  };
  function request(newApplication) {
    return {
      type: Constants.NEW_APPLICATION_ADDED,
      newApplication,
    };
  }
}

function applicationUpdated(applicationId, applicationTitle) {
  return (dispatch) => {
    dispatch(request({ applicationId, applicationTitle }));
  };
  function request(updatedApplication) {
    return {
      type: Constants.APPLICATION_UPDATED,
      updatedApplication,
    };
  }
}

function applicationDeleted(applicationId) {
  return (dispatch) => {
    dispatch(request(applicationId));
  };
  function request(applicationId) {
    return {
      type: Constants.APPLICATION_DELETED,
      applicationId,
    };
  }
}

function topNavChanged(topNav) {
  return (dispatch) => {
    dispatch(request({ topNav }));
  };
  function request(topNav) {
    return { type: Constants.TOP_NAV_CHANGED, topNav };
  }
}

function getClusters() {
  return (dispatch) => {
    fetch('/api/hpcc/read/getClusters', {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((clusters) => {
        dispatch(success(clusters));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  function success(clusters) {
    return { type: Constants.CLUSTERS_RETRIEVED, clusters };
  }
}

function getConsumers() {
  return (dispatch) => {
    fetch('/api/consumer/consumers', {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((consumers) => {
        dispatch(success(consumers));
      })
      .catch((error) => {
        console.log(error);
      });
  };
  function success(consumers) {
    return { type: Constants.CONSUMERS_RETRIEVED, consumers };
  }
}

import { Constants } from '../../components/common/Constants';

export const applicationActions = {
    applicationSelected,
    newApplicationAdded,
    applicationUpdated,
    applicationDeleted,
    topNavChanged    
};

function applicationSelected(applicationId, applicationTitle) {
    return dispatch => {
        dispatch(request({ applicationId, applicationTitle }));
    };
    function request(application) {
        return {
            type: Constants.APPLICATION_SELECTED,
            application
        }
    }
}

function newApplicationAdded(applicationId, applicationTitle) {
    return dispatch => {
        dispatch(request({ applicationId, applicationTitle }));
    };
    function request(newApplication) {
        return {
            type: Constants.NEW_APPLICATION_ADDED,
            newApplication
        }
    }
}

function applicationUpdated(applicationId, applicationTitle) {    
    return dispatch => {
        dispatch(request({ applicationId, applicationTitle }));
    };
    function request(updatedApplication) {
        return {
            type: Constants.APPLICATION_UPDATED,
            updatedApplication
        }
    }
}

function applicationDeleted(applicationId) {    
    return dispatch => {
        dispatch(request(applicationId));
    };
    function request(applicationId) {
        return {
            type: Constants.APPLICATION_DELETED,
            applicationId
        }
    }
}

function topNavChanged(topNav) {
    return dispatch => {
        dispatch(request({ topNav }));
    };
    function request(topNav) { return { type: Constants.TOP_NAV_CHANGED, topNav } }
}
import { Constants } from '../../components/common/Constants';

export const applicationActions = {
    applicationSelected,
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

function topNavChanged(topNav) {
    return dispatch => {
        dispatch(request({ topNav }));
    };
    function request(topNav) { return { type: Constants.TOP_NAV_CHANGED, topNav } }
}
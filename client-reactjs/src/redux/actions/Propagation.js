/* eslint-disable react/react-in-jsx-scope */
import { notification, message, Typography } from 'antd';
import { authHeader } from '../../components/common/AuthHeader';
import { Constants } from '../../components/common/Constants';

const generateReport = ({ history, type }) => {
  return async (dispatch, getState) => {
    try {
      const { applicationReducer } = getState();
      const applicationId = applicationReducer?.application?.applicationId;

      dispatch({
        type: type === 'changes' ? Constants.PROPAGATIONS_CHANGES_INITIATE : Constants.PROPAGATIONS_CURRENT_INITIATE,
      });

      const url =
        type === 'changes' ? `/api/propagation/${applicationId}` : `/api/report/read/generate_current/${applicationId}`;

      const response = await fetch(url, { headers: authHeader() });
      if (!response.ok) throw Error(response.statusText);

      const data = await response.json();

      const goToReport = () => {
        notification.close('report');
        history.push(`/admin/compliance/${type}`);
      };

      notification.success({
        key: 'report',
        duration: 0,
        placement: 'top',
        message: 'Report is ready!',
        description: (
          <>
            <Typography>Report is available under Compliance tab on the left blade</Typography>
            {history.location.pathname.includes('/admin/compliance') ? null : (
              <Typography.Link onClick={goToReport}>Click here to go to report!</Typography.Link>
            )}
          </>
        ),
      });

      dispatch({
        type: type === 'changes' ? Constants.PROPAGATIONS_CHANGES_SUCCESS : Constants.PROPAGATIONS_CURRENT_SUCCESS,
        payload: data,
      });
    } catch (error) {
      message.error(error.message);
      dispatch({
        type: type === 'changes' ? Constants.PROPAGATIONS_CHANGES_ERROR : Constants.PROPAGATIONS_CURRENT_ERROR,
        payload: error.message,
      });
    }
  };
};

const getReports = ({ callFrom }) => {
  return async (dispatch, getState) => {
    try {
      const { applicationReducer } = getState();
      const applicationId = applicationReducer?.application?.applicationId;

      const response = await fetch(`/api/report/read/${applicationId}`, { headers: authHeader() });
      if (!response.ok) throw Error(response.statusText);

      const data = await response.json();
      dispatch(updateReports(data));
    } catch (error) {
      message.error(error.message);
      dispatch({
        type: callFrom === 'changes' ? Constants.PROPAGATIONS_CHANGES_ERROR : Constants.PROPAGATIONS_CURRENT_ERROR,
        payload: error.message,
      });
    }
  };
};

const updateReports = (data) => {
  return { type: Constants.UPDATE_REPORTS, payload: data };
};

export const propagationActions = {
  getReports,
  updateReports,
  generateReport,
};

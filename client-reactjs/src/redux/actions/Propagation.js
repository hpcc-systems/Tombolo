/* eslint-disable react/react-in-jsx-scope */
import { notification, message, Typography } from 'antd';
import { authHeader } from '../../components/common/AuthHeader';
import { Constants } from '../../components/common/Constants';

const propagate = ({ history }) => {
  return async (dispatch, getState) => {
    try {
      const { applicationReducer } = getState();
      const applicationId = applicationReducer?.application?.applicationId;

      dispatch({ type: Constants.PROPAGATIONS_INITIATE });

      const response = await fetch(`/api/propagation/${applicationId}`, { headers: authHeader() });
      if (!response.ok) throw Error(response.statusText);

      const data = await response.json();

      const goToReport = () => {
        notification.close('report');
        history.push('/admin/constraints/report');
      };

      notification.success({
        key: 'report',
        duration: 0,
        placement: 'top',
        message: 'Propagations Report is ready!',
        description: (
          <>
            <Typography>Report is available under Constraints tab on the left blade</Typography>
            {history.location.pathname.includes('/admin/constraints') ? null : (
              <Typography.Link onClick={goToReport}>Click here to go to report!</Typography.Link>
            )}
          </>
        ),
      });

      const reports = JSON.parse(localStorage.getItem('reports'));
      const newReports = reports ? [data, ...reports] : [data];
      localStorage.setItem('reports', JSON.stringify(newReports));

      dispatch({ type: Constants.PROPAGATIONS_SUCCESS, payload: data });
    } catch (error) {
      message.error(error.message);
      dispatch({ type: Constants.PROPAGATIONS_ERROR, payload: error.message });
    }
  };
};

const updateReports = (data) => {
  return { type: Constants.PROPAGATIONS_UPDATE_REPORTS, payload: data };
};

export const propagationActions = {
  propagate,
  updateReports,
};
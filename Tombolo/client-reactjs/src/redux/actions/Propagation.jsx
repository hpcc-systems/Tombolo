import { notification, message, Typography } from 'antd';
import { authHeader } from '../../components/common/AuthHeader';
import {
  propagationsChangesInitiate,
  propagationsChangesSuccess,
  propagationsChangesError,
  propagationsCurrentInitiate,
  propagationsCurrentSuccess,
  propagationsCurrentError,
  updateReports,
} from '../slices/PropagationSlice';

const generateReport = ({ history, type, baseLineId = null }) => {
  return async (dispatch, getState) => {
    try {
      const { application } = getState();
      const applicationId = application?.application?.applicationId;

      dispatch(type === 'changes' ? propagationsChangesInitiate() : propagationsCurrentInitiate());

      let url =
        type === 'changes' ? `/api/propagation/${applicationId}` : `/api/report/read/generate_current/${applicationId}`;

      if (baseLineId) url += `/?baseLineId=${baseLineId}`;

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

      dispatch(type === 'changes' ? propagationsChangesSuccess(data) : propagationsCurrentSuccess(data));
    } catch (error) {
      message.error(error.message);
      dispatch(type === 'changes' ? propagationsChangesError(error.message) : propagationsCurrentError(error.message));
    }
  };
};

const getReports = ({ callFrom }) => {
  return async (dispatch, getState) => {
    try {
      const { application } = getState();
      const applicationId = application?.application?.applicationId;

      const response = await fetch(`/api/report/read/${applicationId}`, { headers: authHeader() });
      if (!response.ok) throw Error(response.statusText);

      const data = await response.json();
      dispatch(updateReports(data));
    } catch (error) {
      message.error(error.message);
      dispatch(
        callFrom === 'changes' ? propagationsChangesError(error.message) : propagationsCurrentError(error.message)
      );
    }
  };
};

export const propagationActions = {
  getReports,
  updateReports,
  generateReport,
};

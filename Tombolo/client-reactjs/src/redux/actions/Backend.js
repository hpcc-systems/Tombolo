import { Constants } from '../../components/common/Constants';
import { authHeader, handleError } from '../../components/common/AuthHeader';

export const checkBackendStatus = () => {
  return async (dispatch) => {
    const isConnected = await fetchBackendStatus();
    dispatch({ type: Constants.SET_BACKEND_STATUS, payload: isConnected });
  };
};

async function fetchBackendStatus() {
  try {
    const response = await fetch('/api/status', { headers: authHeader() });
    if (!response.ok) handleError(response);
    return response.ok;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

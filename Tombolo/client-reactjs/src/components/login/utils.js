import { authHeader } from '../common/AuthHeader.js';

export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const os = window.navigator.userAgentData ? window.navigator.userAgentData.platform : navigator.userAgent;
  let browserName = 'Unknown';

  if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    browserName = 'Opera';
  } else if (userAgent.indexOf('Trident') > -1) {
    browserName = 'Internet Explorer';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
  }

  return { os, browser: browserName };
};

// Make a request to the server to reset the temporary password - OWNER REGISTRATION
export const resetTempPassword = async (resetData) => {
  const payload = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ ...resetData, deviceInfo: getDeviceInfo() }),
  };

  const response = await fetch('/api/auth/resetTempPassword', payload);

  // Get the data from the response
  const responseJson = await response.json();

  // Check if the response is ok
  if (!response.ok) {
    throw new Error(responseJson.message);
  }

  return responseJson;
};

// Make POST request to api/auth/verifyEmail with token in body
export const verifyEmail = async (token) => {
  // eslint-disable-next-line no-unreachable
  const payload = {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ token }),
  };

  const response = await fetch('/api/auth/verifyEmail', payload);

  // Get the data from the response
  const responseJson = await response.json();

  // Check if the response is ok
  if (!response.ok) {
    throw new Error(responseJson.message);
  }

  return responseJson;
};

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

import { apiClient } from '@/services/api';

const wizardService = {
  // SSE endpoint for first run setup with progress updates
  completeFirstRun: async ({ instanceInfo, abortController, onProgress, timeout = 180000 }) => {
    const response = await apiClient.post('/wizard/firstRun', instanceInfo, {
      signal: abortController?.signal,
      responseType: 'text',
      timeout, // Timeout can be overridden by caller, defaults to 180 seconds for long-running setup operations
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.event && progressEvent.event.target) {
          const text = progressEvent.event.target.responseText;
          onProgress(text);
        }
      },
    });
    return response.data;
  },
};

// Constants for wizard setup steps
export const allStepsToCompleteSetup = [
  { step: 1, message: 'Creating owner account' },
  { step: 2, message: 'Setting instance configuration' },
  { step: 3, message: 'Sending verification email' },
];

export default wizardService;

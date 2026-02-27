import { apiClient } from '@/services/api';

const wizardService = {
  completeFirstRun: async ({
    instanceInfo,
    abortController,
    onProgress,
    timeout = 180000,
  }: {
    instanceInfo: any;
    abortController?: AbortController;
    onProgress?: (text: string) => void;
    timeout?: number;
  }): Promise<any> => {
    const response = await apiClient.post('/wizard/firstRun', instanceInfo, {
      signal: abortController?.signal,
      responseType: 'text',
      timeout,
      onDownloadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.event && progressEvent.event.target) {
          const text = progressEvent.event.target.responseText;
          onProgress(text);
        }
      },
    });
    return response.data;
  },
};

export const allStepsToCompleteSetup = [
  { step: 1, message: 'Creating owner account' },
  { step: 2, message: 'Setting instance configuration' },
  { step: 3, message: 'Sending verification email' },
];

export default wizardService;

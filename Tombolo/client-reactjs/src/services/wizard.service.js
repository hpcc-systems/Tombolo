import { apiClient } from '@/services/api';

const wizardService = {
  completeFirstRun: async ({ instanceInfo }) => {
    // This endpoint returns a streaming response (Server-Sent Events)
    // We need to use fetch directly and return the raw Response object
    // so the caller can read the stream
    const response = await fetch('/api/wizard/firstRun', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...apiClient.defaults.headers.common,
      },
      body: JSON.stringify(instanceInfo),
    });

    return response;
  },
};

export default wizardService;

import { apiClient } from '@/services/api';

const sessionService = {
  getActiveSessions: async (userId: string): Promise<any> => {
    const response = await apiClient.get(`/session/getActiveSessions/${userId}`);
    return response.data;
  },

  destroyActiveSession: async (sessionId: string): Promise<any> => {
    const response = await apiClient.delete(`/session/destroyActiveSession/${sessionId}`);
    return response.data;
  },
};

export default sessionService;

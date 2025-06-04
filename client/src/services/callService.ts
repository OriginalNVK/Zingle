import api from './api';
import type { Call } from '../types';

export const callService = {
    initiateCall: async (recipientId: string, type: number): Promise<Call> => {
        const response = await api.post('/calls', {
            recipientId,
            type // 0 for audio, 1 for video
        });
        return response.data;
    },

    updateCallState: async (callId: string, state: number): Promise<Call> => {
        const response = await api.put(`/calls/${callId}`, { state });
        return response.data;
    },

    getCallHistory: async (): Promise<Call[]> => {
        const response = await api.get('/calls');
        return response.data;
    }
};

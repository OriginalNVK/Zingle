import api from './axiosConfig';
import type { Call } from '../types';
import { CallType } from '../types';

export const callApi = {
    initiateCall: async (recipientId: string, type: CallType): Promise<Call> => {
        const response = await api.post<Call>('/calls', {
            recipientId,
            type
        });
        return response.data;
    },

    updateCallState: async (callId: string, state: number): Promise<Call> => {
        const response = await api.put<Call>(`/calls/${callId}`, { state });
        return response.data;
    },

    getCallHistory: async (): Promise<Call[]> => {
        const response = await api.get<Call[]>('/calls');
        return response.data;
    }
};

// client/src/services/chat.service.ts
import api from './api';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  related_data?: {
    currencies?: string[];
    indicators?: string[];
  };
  timestamp: string;
}

export const chatService = {
  sendMessage: async (request: ChatRequest) => {
    const response = await api.post<ChatResponse>('/assistant/chat', request);
    return response.data;
  }
};
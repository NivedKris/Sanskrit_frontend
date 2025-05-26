import { ChatSettings } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aged-voice-9300.ploomber.app/';

const defaultFetchOptions = {
  mode: 'cors' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const sendMessage = async (message: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      ...defaultFetchOptions,
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    // Create FormData to send the audio file
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const response = await fetch(`${API_BASE_URL}/transcribe`, {
      ...defaultFetchOptions,
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header for FormData
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe audio');
    }

    const data = await response.json();
    return data.transcript;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

export const updateSettings = async (settings: ChatSettings): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      ...defaultFetchOptions,
      method: 'POST',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update settings');
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/clear-history`, {
      ...defaultFetchOptions,
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to clear history');
    }
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};

export const uploadPDF = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      ...defaultFetchOptions,
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header for FormData
    });

    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
}; 

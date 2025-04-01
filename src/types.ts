export interface ChatSettings {
  llmModel: string;
  asrModel: 'whisper' | 'conformer' | 'wav2vec2';
  temperature: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

export interface VoiceRecordingState {
  isRecording: boolean;
  error: string | null;
} 
import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, ChatSettings, VoiceRecordingState } from '../types';
import { sendMessage, transcribeAudio } from '../services/api';

// Ayurvedic color palette
const colors = {
  primary: '#8B4513', // Sandalwood brown
  secondary: '#DAA520', // Golden rod
  background: '#FDF5E6', // Old lace
  accent: '#556B2F', // Olive green
  text: '#2F4F4F', // Dark slate gray
  messageUser: '#8B4513', // Sandalwood brown
  messageBot: '#FFF8DC', // Cornsilk
  border: '#D2B48C', // Tan
};

interface ChatInterfaceProps {
  settings: ChatSettings;
  messages?: ChatMessage[];
  onSendMessage?: (message: string, response: string) => void;
  onToggleSettings: () => void;
  onToggleUpload: () => void;
  onClearHistory: () => void;
  onNewChat?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  settings,
  messages: externalMessages,
  onSendMessage,
  onToggleSettings,
  onToggleUpload,
  onClearHistory,
  onNewChat,
}) => {
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceRecordingState>({
    isRecording: false,
    error: null,
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Use external messages if provided, otherwise use local state
  const messages = externalMessages || localMessages;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    // If using external message handling
    if (onSendMessage) {
      // Clear input immediately to improve UX
      setInputText('');

      // First, send the user's message with an empty response to display it immediately
      onSendMessage(inputText, '');

      // Then get the actual response
      setIsLoading(true);
      try {
        const response = await sendMessage(inputText);
        onSendMessage('', response); // Only pass the response to update
      } catch (error) {
        console.error('Error getting bot response:', error);
      } finally {
        setIsLoading(false);
      }
    }
    // If using local messages
    else {
      // Add user message immediately
      setLocalMessages((prev) => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      try {
        const response = await sendMessage(inputText);
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: 'bot',
          timestamp: new Date(),
        };
        setLocalMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error('Error getting bot response:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      setVoiceState({ isRecording: true, error: null });

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setVoiceState({ isRecording: false, error: null });
        setIsTranscribing(true);

        try {
          // Convert to 16kHz audio
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const resampledBlob = await resampleAudio(audioBlob, 16000);

          // Send to backend for transcription
          const transcript = await transcribeAudio(resampledBlob);

          // Update input field with transcription
          setInputText(transcript);
        } catch (error) {
          console.error('Error processing audio:', error);
          setVoiceState({
            isRecording: false,
            error: 'Error processing audio'
          });
        } finally {
          setIsTranscribing(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start();

    } catch (error) {
      console.error('Error starting recording:', error);
      setVoiceState({
        isRecording: false,
        error: 'Error starting recording'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Function to resample audio to 16kHz
  const resampleAudio = async (audioBlob: Blob, targetSampleRate: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        if (!event.target) {
          reject(new Error('Error reading file'));
          return;
        }

        const arrayBuffer = event.target.result as ArrayBuffer;

        try {
          // Create audio context
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: targetSampleRate
          });

          // Decode audio
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Create offline context for resampling
          const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.duration * targetSampleRate,
            targetSampleRate
          );

          // Create buffer source
          const source = offlineContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(offlineContext.destination);

          // Start source and render
          source.start(0);
          const renderedBuffer = await offlineContext.startRendering();

          // Convert to wav
          const wavBlob = bufferToWav(renderedBuffer);
          resolve(wavBlob);

        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      fileReader.readAsArrayBuffer(audioBlob);
    });
  };

  // Convert AudioBuffer to WAV format
  const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numOfChannels * 2;
    const sampleRate = buffer.sampleRate;
    const wavDataView = new DataView(new ArrayBuffer(44 + length));

    // WAV header
    writeString(wavDataView, 0, 'RIFF');
    wavDataView.setUint32(4, 36 + length, true);
    writeString(wavDataView, 8, 'WAVE');
    writeString(wavDataView, 12, 'fmt ');
    wavDataView.setUint32(16, 16, true);
    wavDataView.setUint16(20, 1, true);
    wavDataView.setUint16(22, numOfChannels, true);
    wavDataView.setUint32(24, sampleRate, true);
    wavDataView.setUint32(28, sampleRate * numOfChannels * 2, true);
    wavDataView.setUint16(32, numOfChannels * 2, true);
    wavDataView.setUint16(34, 16, true);
    writeString(wavDataView, 36, 'data');
    wavDataView.setUint32(40, length, true);

    // Write audio data
    const channels = [];
    for (let i = 0; i < numOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let j = 0; j < numOfChannels; j++) {
        const sample = Math.max(-1, Math.min(1, channels[j][i]));
        wavDataView.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([wavDataView], { type: 'audio/wav' });
  };

  // Helper function to write string to DataView
  const writeString = (dataView: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      dataView.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const toggleRecording = () => {
    if (voiceState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleOpenClearConfirm = () => {
    setConfirmClearOpen(true);
  };

  const handleCloseClearConfirm = () => {
    setConfirmClearOpen(false);
  };

  const clearHistory = () => {
    setLocalMessages([]);
    onClearHistory();
    setConfirmClearOpen(false);
  };

  return (
    <Box sx={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: colors.background,
      overflow: 'hidden',
    }}>
      {/* Title bar */}
      <Box sx={{
        py: 1.5,
        px: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${colors.border}`,
        bgcolor: colors.primary,
        color: '#fff'
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          ml: { xs: 5, sm: 0 }, // Add margin-left on mobile to account for menu icon
          flexGrow: 1 // Allow the title section to grow
        }}>
          <Typography sx={{
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            fontFamily: 'serif',
            letterSpacing: '0.5px'
          }}>
            {isMobile ? 'आयुर्वेद AI' : 'आयुर्वेद Guru'}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              opacity: 0.9,
              fontStyle: 'italic',
              ml: { xs: 1, sm: 2 },
              display: { xs: 'none', sm: 'block' } // Hide subtitle on mobile
            }}
          >
            Sanskrit & Ayurveda Assistant
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onNewChat && !isMobile && (
            <Tooltip title="New Chat">
              <IconButton onClick={onNewChat} sx={{ color: 'inherit' }}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
          <IconButton onClick={onToggleUpload} sx={{ color: 'inherit' }}>
            <UploadIcon />
          </IconButton>
          <IconButton onClick={onToggleSettings} sx={{ color: 'inherit' }}>
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={handleOpenClearConfirm} sx={{ color: 'inherit' }}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        py: 3,
        px: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: colors.background
      }}>
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2,
              color: colors.text,
              opacity: 0.7,
              mt: { xs: 5, sm: 0 },
              px: { xs: 3, sm: 0 }
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'serif',
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                textAlign: 'center',
                mt: { xs: 4, sm: 0 }
              }}
            >
              {isMobile ? 'आयुर्वेद AI' : 'आयुर्वेद Guru'}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                maxWidth: '500px',
                textAlign: 'center',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Ask me anything about Sanskrit or Ayurveda. I can help with translations, explain concepts, or answer questions.
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: message.sender === 'user' ? colors.messageUser : colors.messageBot,
                  color: message.sender === 'user' ? '#fff' : colors.text,
                  borderRadius: 2,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {message.sender === 'user' ? (
                  message.text
                ) : (
                  <Box sx={{
                    '& a': { color: colors.accent, textDecoration: 'underline' },
                    '& p': { margin: '0.5em 0' },
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      margin: '0.5em 0',
                      color: colors.text,
                      fontFamily: 'serif',
                      fontWeight: 'bold'
                    },
                    '& h1': { fontSize: '1.6em' },
                    '& h2': { fontSize: '1.4em' },
                    '& h3': { fontSize: '1.2em' },
                    '& h4': { fontSize: '1.1em' },
                    '& h5, & h6': { fontSize: '1em' },
                    '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
                    '& li': { margin: '0.25em 0' },
                    '& blockquote': {
                      borderLeft: `4px solid ${colors.border}`,
                      margin: '0.5em 0',
                      padding: '0 1em',
                      fontStyle: 'italic',
                      color: `${colors.text}cc`
                    },
                    '& img': {
                      maxWidth: '100%',
                      borderRadius: '4px'
                    },
                    '& hr': {
                      border: 'none',
                      borderTop: `1px solid ${colors.border}`,
                      margin: '1em 0'
                    },
                    '& strong': { fontWeight: 'bold' },
                    '& em': { fontStyle: 'italic' },
                    '& code': {
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      padding: '0.1em 0.3em',
                      borderRadius: '3px',
                      fontSize: '0.9em'
                    },
                    '& pre': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      padding: '0.5em',
                      borderRadius: '4px',
                      overflowX: 'auto',
                      margin: '0.5em 0'
                    },
                    '& pre code': {
                      backgroundColor: 'transparent',
                      padding: 0
                    }
                  }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </Box>
                )}
              </Paper>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{
        py: 2,
        px: 3,
        borderTop: `1px solid ${colors.border}`,
        bgcolor: '#fff',
        display: 'flex',
        gap: 2
      }}>
        <IconButton
          onClick={toggleRecording}
          disabled={isTranscribing}
          sx={{
            color: voiceState.isRecording
              ? colors.accent
              : isTranscribing
                ? `${colors.text}40`
                : colors.primary,
            '&:hover': {
              bgcolor: `${colors.primary}10`
            },
            '&.Mui-disabled': {
              color: `${colors.text}40`
            }
          }}
        >
          {isTranscribing ? (
            <CircularProgress size={24} sx={{ color: colors.primary }} />
          ) : (
            voiceState.isRecording ? <MicOffIcon /> : <MicIcon />
          )}
        </IconButton>
        <TextField
          fullWidth
          variant="standard"
          placeholder={isTranscribing ? "Transcribing audio..." : "Type your message..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading || isTranscribing}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '1rem',
              color: colors.text,
              '&::placeholder': {
                color: `${colors.text}80`
              }
            }
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={isLoading || isTranscribing || !inputText.trim()}
          sx={{
            color: inputText.trim() ? colors.primary : `${colors.text}40`,
            '&:hover': {
              bgcolor: `${colors.primary}10`
            },
            '&.Mui-disabled': {
              color: `${colors.text}40`
            }
          }}
        >
          {isLoading ? <CircularProgress size={24} sx={{ color: colors.primary }} /> : <SendIcon />}
        </IconButton>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmClearOpen}
        onClose={handleCloseClearConfirm}
        aria-labelledby="clear-chat-dialog-title"
        aria-describedby="clear-chat-dialog-description"
        PaperProps={{
          style: {
            borderRadius: '8px',
          }
        }}
      >
        <DialogTitle id="clear-chat-dialog-title"
          sx={{
            bgcolor: colors.primary,
            color: 'white',
            fontFamily: 'serif',
          }}
        >
          Clear Chat History
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText id="clear-chat-dialog-description">
            Are you sure you want to clear all chat history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseClearConfirm}
            sx={{
              color: colors.text,
              '&:hover': {
                bgcolor: `${colors.text}10`
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={clearHistory}
            variant="contained"
            sx={{
              bgcolor: colors.primary,
              '&:hover': {
                bgcolor: colors.accent
              }
            }}
          >
            Clear History
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatInterface; 
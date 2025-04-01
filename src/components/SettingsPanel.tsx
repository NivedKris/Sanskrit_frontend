import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  Slider,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { ChatSettings } from '../types';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

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

interface SettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (newSettings: Partial<ChatSettings>) => void;
  onToggleSettings: () => void;
}

interface LLMOption {
  value: string;
  label: string;
  description: string;
}

const llmOptions: LLMOption[] = [
  {
    value: 'gemma2-9b-it',
    label: 'Gemma 2 (9B)',
    description: 'Efficient model for general questions with good balance of speed and quality'
  },
  {
    value: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 (8B)',
    description: 'Fast, responsive model for quick interactions and basic tasks'
  },
  {
    value: 'deepseek-r1-distill-qwen-32b',
    label: 'DeepSeek Qwen (32B)',
    description: 'Robust model for complex reasoning and detailed responses'
  },
  {
    value: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 (70B)',
    description: 'Most capable model for complex tasks'
  }
];

// ASR model type definition based on the settings type
type ASRModelType = 'whisper' | 'conformer' | 'wav2vec2';

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onToggleSettings
}) => {
  const handleTemperatureChange = (event: Event, newValue: number | number[]) => {
    onSettingsChange({ temperature: newValue as number });
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
      {/* Title bar with back button */}
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Back to Chat">
            <IconButton
              onClick={onToggleSettings}
              sx={{
                color: 'white',
                mr: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography sx={{
            fontSize: '1.5rem',
            fontFamily: 'serif',
            letterSpacing: '0.5px'
          }}>
            Settings
          </Typography>
        </Box>
      </Box>

      {/* Settings content */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        py: 3,
        px: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}>
        <Paper sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <Typography variant="h6" sx={{ mb: 2, color: colors.text, fontFamily: 'serif' }}>
            Language Model
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="llm-model-label">Model</InputLabel>
            <Select
              labelId="llm-model-label"
              id="llm-model"
              value={settings.llmModel}
              label="Model"
              onChange={(e) => onSettingsChange({ llmModel: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary,
                },
              }}
            >
              {llmOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {option.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="asr-model-label">Speech Recognition</InputLabel>
            <Select
              labelId="asr-model-label"
              id="asr-model"
              value={settings.asrModel}
              label="Speech Recognition"
              onChange={(e) => onSettingsChange({ asrModel: e.target.value as ASRModelType })}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary,
                },
              }}
            >
              <MenuItem value="conformer">Conformer</MenuItem>
              <MenuItem value="whisper">Whisper</MenuItem>
              <MenuItem value="wav2vec2">Wav2Vec2</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ width: '100%', mb: 1 }}>
            <Typography id="temperature-slider" gutterBottom sx={{ color: colors.text }}>
              Temperature: {settings.temperature}
            </Typography>
            <Slider
              value={settings.temperature}
              onChange={handleTemperatureChange}
              aria-labelledby="temperature-slider"
              step={0.1}
              marks
              min={0}
              max={1}
              valueLabelDisplay="auto"
              sx={{
                color: colors.primary,
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0px 0px 0px 8px ${colors.primary}33`,
                  },
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: colors.primary,
                },
              }}
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: colors.text }}>
              Lower values (closer to 0) produce more focused, deterministic responses. Higher values (closer to 1) produce more creative, varied responses.
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{
          p: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <Typography variant="h6" sx={{ mb: 2, color: colors.text, fontFamily: 'serif' }}>
            About
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text, mb: 1 }}>
            This Sanskrit & Ayurveda Assistant is designed to help you explore ancient wisdom through modern technology.
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text }}>
            The system uses state-of-the-art language models and speech recognition technology to provide accurate information about Sanskrit texts, Ayurvedic concepts, and related practices.
          </Typography>
        </Paper>
      </Box>

      {/* Bottom action bar */}
      <Box sx={{
        p: 2,
        borderTop: `1px solid ${colors.border}`,
        bgcolor: '#fff',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <Button
          variant="contained"
          onClick={onToggleSettings}
          sx={{
            bgcolor: colors.primary,
            '&:hover': {
              bgcolor: colors.accent,
            },
          }}
        >
          Back to Chat
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPanel; 
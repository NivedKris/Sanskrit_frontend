import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { uploadPDF } from '../services/api';

// Ayurvedic color palette
const colors = {
  primary: '#8B4513', // Sandalwood brown
  secondary: '#DAA520', // Golden rod
  background: '#FDF5E6', // Old lace
  accent: '#556B2F', // Olive green
  text: '#2F4F4F', // Dark slate gray
  border: '#D2B48C', // Tan
};

interface PDFUploadProps {
  onToggleUpload: () => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onToggleUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus({
        type: 'error',
        message: 'Please select a valid PDF file.',
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const message = await uploadPDF(selectedFile);
      setUploadStatus({
        type: 'success',
        message,
      });
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Failed to upload PDF. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
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
              onClick={onToggleUpload}
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
            Upload Sanskrit Texts
          </Typography>
        </Box>
      </Box>

      {/* Upload Area */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        overflow: 'auto',
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            bgcolor: '#fff',
            borderRadius: 2,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Typography variant="h6" sx={{
            color: colors.text,
            fontFamily: 'serif',
            textAlign: 'center',
          }}>
            Upload Sanskrit PDF Documents
          </Typography>

          <Box sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <label htmlFor="pdf-upload">
              <Button
                component="span"
                variant="outlined"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{
                  py: 2,
                  border: `1px dashed ${colors.border}`,
                  color: colors.text,
                  '&:hover': {
                    border: `1px dashed ${colors.primary}`,
                    bgcolor: `${colors.primary}10`,
                  },
                }}
              >
                Select PDF File
              </Button>
            </label>

            {selectedFile && (
              <Typography sx={{
                color: colors.text,
                textAlign: 'center',
              }}>
                Selected: {selectedFile.name}
              </Typography>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              variant="contained"
              sx={{
                bgcolor: colors.primary,
                color: '#fff',
                '&:hover': {
                  bgcolor: colors.secondary,
                },
                '&.Mui-disabled': {
                  bgcolor: `${colors.text}40`,
                },
              }}
            >
              {isUploading ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                'Upload Document'
              )}
            </Button>
          </Box>

          {uploadStatus && (
            <Alert
              severity={uploadStatus.type}
              sx={{
                width: '100%',
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              {uploadStatus.message}
            </Alert>
          )}
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
          onClick={onToggleUpload}
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

export default PDFUpload; 
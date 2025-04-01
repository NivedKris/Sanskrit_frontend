import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Slide,
  Snackbar,
  Alert,
  useMediaQuery,
  IconButton,
  Drawer,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import ChatInterface from './components/ChatInterface';
import SettingsPanel from './components/SettingsPanel';
import PDFUpload from './components/PDFUpload';
import ChatSidebar from './components/ChatSidebar';
import { ChatSettings } from './types';
import { updateSettings, clearHistory } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8B4513',
    },
    secondary: {
      main: '#DAA520',
    },
  },
  transitions: {
    duration: {
      enteringScreen: 300,
      leavingScreen: 300,
    },
  },
});

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
  }>;
}

const defaultSettings: ChatSettings = {
  llmModel: 'llama-3.1-8b-instant',
  asrModel: 'conformer',
  temperature: 0.3,
};

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Initialize with a new chat on first load - using a ref to ensure it only runs once
  const initializedRef = useRef(false);

  useEffect(() => {
    if (chatHistory.length === 0 && !initializedRef.current) {
      initializedRef.current = true;

      // Creating initial chat with a unique ID
      const initialChatId = Date.now().toString();

      const initialChat: ChatHistoryItem = {
        id: initialChatId,
        title: "New Chat",
        timestamp: new Date(),
        messages: []
      };

      setChatHistory([initialChat]);
      setActiveChatId(initialChatId);
    }
  }, [chatHistory.length]);

  const handleSettingsChange = async (newSettings: Partial<ChatSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await updateSettings(updatedSettings);

      // Show notification when model is changed
      if (newSettings.llmModel && newSettings.llmModel !== settings.llmModel) {
        setSnackbar({
          open: true,
          message: `Language model changed to ${newSettings.llmModel}`,
          severity: 'info'
        });
      }

      // Show notification when ASR model is changed
      if (newSettings.asrModel && newSettings.asrModel !== settings.asrModel) {
        setSnackbar({
          open: true,
          message: `Speech recognition model changed to ${newSettings.asrModel}`,
          severity: 'info'
        });
      }

      // Show notification when temperature is changed
      if (newSettings.temperature !== undefined && newSettings.temperature !== settings.temperature) {
        setSnackbar({
          open: true,
          message: `Temperature set to ${newSettings.temperature}`,
          severity: 'info'
        });
      }

    } catch (error) {
      console.error('Failed to update settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update settings',
        severity: 'error'
      });
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();

      if (activeChatId) {
        // Update the chat history by clearing messages for active chat
        setChatHistory(prev => prev.map(chat =>
          chat.id === activeChatId
            ? { ...chat, messages: [], title: "New Chat" }
            : chat
        ));
      }

      setSnackbar({
        open: true,
        message: 'Chat history cleared successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to clear history',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    setShowUpload(false); // Close upload if open
  };

  const toggleUpload = () => {
    setShowUpload(!showUpload);
    setShowSettings(false); // Close settings if open
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();

    const newChat: ChatHistoryItem = {
      id: newChatId,
      title: "New Chat",
      timestamp: new Date(),
      messages: []
    };

    setChatHistory(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);

    // Close mobile sidebar if open
    if (isSmallScreen) {
      setMobileOpen(false);
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);

    // Close mobile sidebar if open
    if (isSmallScreen) {
      setMobileOpen(false);
    }
  };

  const handleDeleteChat = (id: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));

    // If deleting active chat, select the first available chat or create a new one
    if (id === activeChatId) {
      const remainingChats = chatHistory.filter(chat => chat.id !== id);
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleSendMessage = (message: string, response: string) => {
    if (!activeChatId) return;

    // If there's a message, it's a user message
    if (message) {
      const userMessageId = Date.now().toString();

      setChatHistory(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          // Update title if this is the first message
          const updatedTitle = chat.messages.length === 0
            ? message.length > 30
              ? `${message.substring(0, 30)}...`
              : message
            : chat.title;

          return {
            ...chat,
            title: updatedTitle,
            timestamp: new Date(),
            messages: [
              ...chat.messages,
              {
                id: userMessageId,
                text: message,
                sender: 'user',
                timestamp: new Date()
              }
            ]
          };
        }
        return chat;
      }));
    }

    // If there's a response, it's a bot message
    if (response) {
      const botMessageId = Date.now().toString();

      setChatHistory(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            timestamp: new Date(),
            messages: [
              ...chat.messages,
              {
                id: botMessageId,
                text: response,
                sender: 'bot',
                timestamp: new Date()
              }
            ]
          };
        }
        return chat;
      }));
    }
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  // Get current chat messages
  const currentChat = chatHistory.find(chat => chat.id === activeChatId);
  const currentMessages = currentChat?.messages || [];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
        {/* Sidebar - Desktop */}
        {!isSmallScreen && (
          <ChatSidebar
            chatHistory={chatHistory}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            activeChatId={activeChatId || undefined}
          />
        )}

        {/* Sidebar - Mobile Drawer */}
        {isSmallScreen && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={toggleMobileSidebar}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: '260px',
                bgcolor: '#F5EFE0'
              },
              display: { xs: 'block', md: 'none' },
            }}
          >
            <Box sx={{
              bgcolor: '#8B4513',
              color: 'white',
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography sx={{ fontFamily: 'serif', fontWeight: 500 }}>
                Chat History
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <ChatSidebar
                chatHistory={chatHistory}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                activeChatId={activeChatId || undefined}
              />
            </Box>
          </Drawer>
        )}

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
          {isSmallScreen && (
            <IconButton
              onClick={toggleMobileSidebar}
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 2000,
                color: 'white'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Slide direction="right" in={!showSettings && !showUpload} mountOnEnter unmountOnExit>
            <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
              <ChatInterface
                settings={settings}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                onToggleSettings={toggleSettings}
                onToggleUpload={toggleUpload}
                onClearHistory={handleClearHistory}
                onNewChat={handleNewChat}
              />
            </Box>
          </Slide>
          <Slide direction="left" in={showSettings} mountOnEnter unmountOnExit>
            <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
              <SettingsPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onToggleSettings={toggleSettings}
              />
            </Box>
          </Slide>
          <Slide direction="left" in={showUpload} mountOnEnter unmountOnExit>
            <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
              <PDFUpload onToggleUpload={toggleUpload} />
            </Box>
          </Slide>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: '100%',
              bgcolor: snackbar.severity === 'success' || snackbar.severity === 'info'
                ? theme.palette.primary.light
                : undefined,
              color: snackbar.severity === 'success' || snackbar.severity === 'info'
                ? 'white'
                : undefined,
              '& .MuiAlert-icon': {
                color: snackbar.severity === 'success' || snackbar.severity === 'info'
                  ? 'white'
                  : undefined
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App; 
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ChatBubbleOutline as ChatIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Use the same Ayurvedic color palette
const colors = {
  primary: '#8B4513', // Sandalwood brown
  secondary: '#DAA520', // Golden rod
  background: '#FDF5E6', // Old lace
  accent: '#556B2F', // Olive green
  text: '#2F4F4F', // Dark slate gray
  border: '#D2B48C', // Tan
  sidebarBg: '#F5EFE0', // Lighter version of background
};

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  chatHistory: ChatHistoryItem[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  activeChatId?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatHistory,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  activeChatId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{
      height: isMobile ? 'calc(100vh - 52px)' : '100vh', // Subtract header height on mobile
      width: '260px',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: colors.sidebarBg,
      borderRight: !isMobile ? `1px solid ${colors.border}` : 'none',
    }}>
      {/* Header/New Chat Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onNewChat}
          sx={{
            bgcolor: colors.primary,
            color: 'white',
            py: 1,
            '&:hover': {
              bgcolor: `${colors.primary}DD`,
            },
            textTransform: 'none',
            fontWeight: 'medium',
            borderRadius: '8px',
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider sx={{ borderColor: `${colors.border}80` }} />

      {/* Chat History List */}
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: `${colors.border}80`,
          borderRadius: '3px',
        },
      }}>
        {chatHistory.length === 0 ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            opacity: 0.6,
            flexDirection: 'column',
            gap: 2
          }}>
            <ChatIcon sx={{ fontSize: '2rem', color: colors.text }} />
            <Typography
              variant="body2"
              sx={{
                color: colors.text,
                textAlign: 'center',
                px: 3
              }}
            >
              Your chat history will appear here
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {chatHistory.map((chat) => (
              <ListItem
                key={chat.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    sx={{
                      opacity: 0.6,
                      '&:hover': {
                        opacity: 1
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  '& .MuiListItemSecondaryAction-root': {
                    visibility: 'hidden'
                  },
                  '&:hover .MuiListItemSecondaryAction-root': {
                    visibility: 'visible'
                  }
                }}
              >
                <ListItemButton
                  selected={activeChatId === chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      bgcolor: `${colors.primary}15`,
                      '&:hover': {
                        bgcolor: `${colors.primary}20`,
                      }
                    },
                    '&:hover': {
                      bgcolor: `${colors.primary}10`,
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        noWrap
                        sx={{
                          color: colors.text,
                          fontWeight: activeChatId === chat.id ? 600 : 400,
                          fontSize: '0.9rem'
                        }}
                      >
                        {chat.title}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          color: `${colors.text}99`,
                          fontSize: '0.75rem'
                        }}
                      >
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${colors.border}80` }}>
        <Typography
          variant="caption"
          component="div"
          sx={{
            color: colors.text,
            opacity: 0.8,
            textAlign: 'center'
          }}
        >
          आयुर्वेद Guru • Sanskrit Assistant
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatSidebar; 
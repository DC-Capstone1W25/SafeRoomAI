// src/components/AIFeedbackButtons.jsx
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Fade,
  CircularProgress,
  Button,
  Paper
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Feedback,
  CheckCircle,
  Cancel
} from '@mui/icons-material';

const AIFeedbackButtons = ({ 
  suggestionId, 
  suggestionType = 'anomaly',
  onFeedback,
  size = 'small',
  variant = 'default', // 'default', 'compact', 'inline'
  disabled = false,
  initialFeedback = null
}) => {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleFeedback = async (type, event) => {
    // Simple event prevention
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (disabled || loading) return;

    setLoading(true);
    try {
      // Call the parent callback
      if (onFeedback) {
        await onFeedback(suggestionId, type, suggestionType, event);
      }

      setFeedback(type);
      setShowConfirmation(true);

      // Hide confirmation after 2 seconds
      setTimeout(() => {
        setShowConfirmation(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackColor = (type) => {
    if (feedback === type) {
      return type === 'accept' ? 'success' : 'error';
    }
    return 'default';
  };

  const getFeedbackIcon = (type) => {
    if (loading && feedback === type) {
      return <CircularProgress size={16} />;
    }
    return type === 'accept' ? <ThumbUp /> : <ThumbDown />;
  };

  // Compact variant for tight spaces - GitHub-style
  if (variant === 'compact') {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        sx={{
          p: 0.5,
          borderRadius: 1,
          backgroundColor: showConfirmation ? 'success.light' : 'transparent',
          transition: 'all 0.2s ease'
        }}
      >
        {showConfirmation ? (
          <Fade in={showConfirmation}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <CheckCircle fontSize="small" color="success" />
              <Typography variant="caption" color="success.dark" fontWeight={600}>
                {feedback === 'accept' ? 'Helpful!' : 'Thanks!'}
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Box display="flex" gap={0.5}>
            <Button
              size="small"
              variant={feedback === 'accept' ? 'contained' : 'outlined'}
              color="success"
              startIcon={loading && feedback === 'accept' ? <CircularProgress size={12} /> : <ThumbUp />}
              onClick={(e) => handleFeedback('accept', e)}
              disabled={disabled || loading}
              sx={{
                minWidth: 'auto',
                px: 1,
                py: 0.25,
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              Yes
            </Button>
            <Button
              size="small"
              variant={feedback === 'reject' ? 'contained' : 'outlined'}
              color="error"
              startIcon={loading && feedback === 'reject' ? <CircularProgress size={12} /> : <ThumbDown />}
              onClick={(e) => handleFeedback('reject', e)}
              disabled={disabled || loading}
              sx={{
                minWidth: 'auto',
                px: 1,
                py: 0.25,
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }
              }}
            >
              No
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Inline variant for integration within text/content
  if (variant === 'inline') {
    return (
      <Box display="inline-flex" alignItems="center" gap={1} ml={1}>
        <Typography variant="caption" color="text.secondary">
          Helpful?
        </Typography>
        <Box display="flex" gap={0.5}>
          <IconButton
            size="small"
            onClick={(e) => handleFeedback('accept', e)}
            disabled={disabled || loading}
            color={getFeedbackColor('accept')}
            sx={{ p: 0.25 }}
          >
            {getFeedbackIcon('accept')}
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => handleFeedback('reject', e)}
            disabled={disabled || loading}
            color={getFeedbackColor('reject')}
            sx={{ p: 0.25 }}
          >
            {getFeedbackIcon('reject')}
          </IconButton>
        </Box>
      </Box>
    );
  }

  // Default variant - GitHub-style suggestion interface
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Feedback fontSize="small" color="action" />
      <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: 500 }}>
        Was this AI suggestion helpful?
      </Typography>

      {showConfirmation ? (
        <Fade in={showConfirmation}>
          <Chip
            icon={feedback === 'accept' ? <CheckCircle /> : <Cancel />}
            label={feedback === 'accept' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve this'}
            size="small"
            color={feedback === 'accept' ? 'success' : 'warning'}
            sx={{
              fontWeight: 500,
              '& .MuiChip-icon': {
                fontSize: '16px'
              }
            }}
          />
        </Fade>
      ) : (
        <Box display="flex" gap={1}>
          <Button
            size="small"
            variant={feedback === 'accept' ? 'contained' : 'outlined'}
            color="success"
            startIcon={loading && feedback === 'accept' ? <CircularProgress size={14} /> : <ThumbUp />}
            onClick={(e) => handleFeedback('accept', e)}
            disabled={disabled || loading}
            sx={{
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 1.5,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          >
            Yes
          </Button>
          <Button
            size="small"
            variant={feedback === 'reject' ? 'contained' : 'outlined'}
            color="error"
            startIcon={loading && feedback === 'reject' ? <CircularProgress size={14} /> : <ThumbDown />}
            onClick={(e) => handleFeedback('reject', e)}
            disabled={disabled || loading}
            sx={{
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 1.5,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }
            }}
          >
            No
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default AIFeedbackButtons;

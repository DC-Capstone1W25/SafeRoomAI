// src/screens/ActivityFeed.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Box,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Pagination,
  Alert
} from '@mui/material';
import {
  Search,
  Refresh,
  Warning,
  Close,
  AccessTime
} from '@mui/icons-material';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import AIFeedbackButtons from '../components/AIFeedbackButtons';
import feedbackService from '../services/feedbackService';

export default function ActivityFeed() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbackStates, setFeedbackStates] = useState({});
  const itemsPerPage = 12;

  useEffect(() => {
    async function fetchList() {
      try {
        setLoading(true);
        const res = await fetch('/predict/activity/list');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setFiles(data);
          setError(null);
        } else {
          console.warn('Expected an array but got:', data);
          setFiles([]);
          setError('No activity found.');
        }
      } catch (e) {
        console.error('Error fetching activity list:', e);
        setFiles([]);
        setError('Failed to load activity.');
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch + auto-refresh every 10s
    fetchList();
    const interval = setInterval(fetchList, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter files based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(fname => {
        const prefix = fname.slice(0, 15);
        const iso = `${prefix.slice(0, 4)}-${prefix.slice(4, 6)}-${prefix.slice(6, 8)}T${prefix.slice(9, 11)}:${prefix.slice(11, 13)}:${prefix.slice(13, 15)}`;
        const displayTime = new Date(iso).toLocaleString();
        return displayTime.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredFiles(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [files, searchTerm]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/predict/activity/list');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setFiles(data);
        setError(null);
      }
    } catch (e) {
      setError('Failed to refresh activity.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (fname) => {
    const prefix = fname.slice(0, 15);
    const iso = `${prefix.slice(0, 4)}-${prefix.slice(4, 6)}-${prefix.slice(6, 8)}T${prefix.slice(9, 11)}:${prefix.slice(11, 13)}:${prefix.slice(13, 15)}`;
    return new Date(iso);
  };

  const handleFeedback = async (suggestionId, feedbackType, suggestionType) => {
    try {
      await feedbackService.submitFeedback(suggestionId, feedbackType, suggestionType, {
        filename: suggestionId,
        timestamp: formatTimestamp(suggestionId).toISOString()
      });

      setFeedbackStates(prev => ({
        ...prev,
        [suggestionId]: feedbackType
      }));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFiles = filteredFiles.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return <LoadingSpinner message="Loading activity feed..." />;
  }

  return (
    <Container maxWidth="xl">
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Activity Feed
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Recent anomaly detections and security events
        </Typography>
      </Box>

      {/* Controls */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search by date/time..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <IconButton onClick={handleRefresh} disabled={loading}>
          <Refresh />
        </IconButton>
        <Chip
          icon={<AccessTime />}
          label={`${filteredFiles.length} events`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {error && (
        <ErrorAlert
          message={error}
          onRetry={handleRefresh}
          sx={{ mb: 3 }}
        />
      )}

      {filteredFiles.length === 0 && !error ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No activity snapshots found. {searchTerm && 'Try adjusting your search terms.'}
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedFiles.map((fname) => {
              const timestamp = formatTimestamp(fname);
              const displayTime = format(timestamp, 'MMM dd, yyyy HH:mm:ss');

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={fname}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: feedbackStates[fname] === 'accept'
                        ? '2px solid #10b981'
                        : feedbackStates[fname] === 'reject'
                        ? '2px solid #ef4444'
                        : '1px solid',
                      borderColor: feedbackStates[fname] ? 'transparent' : 'divider',
                      boxShadow: feedbackStates[fname] === 'accept'
                        ? '0 4px 12px rgba(16, 185, 129, 0.2)'
                        : feedbackStates[fname] === 'reject'
                        ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                        : undefined,
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: feedbackStates[fname] === 'accept'
                          ? '0 6px 16px rgba(16, 185, 129, 0.3)'
                          : feedbackStates[fname] === 'reject'
                          ? '0 6px 16px rgba(239, 68, 68, 0.3)'
                          : '0 4px 12px rgba(0,0,0,0.1)'
                      }
                    }}
                    onClick={() => setSelectedImage({ fname, timestamp })}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={`/predict/activity/${fname}`}
                      alt={`Anomaly at ${displayTime}`}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Warning color="warning" fontSize="small" />
                        <Typography variant="caption" color="warning.main" fontWeight="bold">
                          ANOMALY DETECTED
                        </Typography>
                        {feedbackStates[fname] && (
                          <Chip
                            size="small"
                            label={feedbackStates[fname] === 'accept' ? 'Helpful' : 'Not helpful'}
                            color={feedbackStates[fname] === 'accept' ? 'success' : 'error'}
                            sx={{ fontSize: '0.6rem', height: '16px' }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {displayTime}
                      </Typography>

                      {/* AI Feedback Buttons */}
                      <Box
                        onClick={(e) => e.stopPropagation()} // Prevent card click when interacting with feedback
                        sx={{ mt: 1 }}
                      >
                        <AIFeedbackButtons
                          suggestionId={fname}
                          suggestionType="anomaly_detection"
                          onFeedback={handleFeedback}
                          variant="compact"
                          initialFeedback={feedbackStates[fname]}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Image Modal */}
      <Dialog
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedImage && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Anomaly Detection - {format(selectedImage.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                </Typography>
                <IconButton onClick={() => setSelectedImage(null)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <img
                src={`/predict/activity/${selectedImage.fname}`}
                alt="Anomaly detail"
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}

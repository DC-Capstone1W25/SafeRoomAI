// src/screens/HomeScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  Videocam,
  VideocamOff,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import StatsCard from '../components/StatsCard';

export default function HomeScreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate connection status check
    const checkConnection = () => {
      // In a real app, you'd check if the video stream is actually working
      setConnectionStatus('connected');
      setLastUpdate(new Date());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'disconnected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Videocam />;
      case 'disconnected': return <VideocamOff />;
      default: return <Warning />;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Live Security Feed
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time monitoring with AI-powered anomaly detection
        </Typography>
      </Box>

      {/* Status Alert */}
      {connectionStatus === 'disconnected' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Camera connection lost. Please check your camera setup.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Video Feed */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ position: 'relative', height: isFullscreen ? '80vh' : '500px' }}>
            <CardContent sx={{ p: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    icon={getStatusIcon()}
                    label={connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                    color={getStatusColor()}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </Typography>
                </Box>
                <IconButton onClick={toggleFullscreen} size="small">
                  {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
              </Box>

              <Box
                sx={{
                  width: '100%',
                  height: 'calc(100vh - 100px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
              <img
                src="/predict/video"
                alt="Live security feed"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: 4,
                }}
                onError={() => setConnectionStatus('disconnected')}
                onLoad={() => setConnectionStatus('connected')}
              />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Panel */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <StatsCard
                title="System Status"
                value={connectionStatus === 'connected' ? 'Online' : 'Offline'}
                subtitle="Camera feed status"
                icon={<CheckCircle />}
                color={connectionStatus === 'connected' ? 'success' : 'error'}
              />
            </Grid>
            <Grid item xs={12}>
              <StatsCard
                title="Detection Mode"
                value="Active"
                subtitle="AI anomaly detection enabled"
                icon={<Warning />}
                color="warning"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

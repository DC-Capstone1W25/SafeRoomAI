// src/components/FeedbackDemo.jsx
import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import {
  Psychology,
  Security,
  Analytics,
  Timeline
} from '@mui/icons-material';
import AIFeedbackButtons from './AIFeedbackButtons';
import useFeedbackState from '../hooks/useFeedbackState';

const FeedbackDemo = () => {
  const { feedbackStates, submitFeedback, getFeedbackStats } = useFeedbackState('demo');
  const stats = getFeedbackStats();

  const handleFeedback = async (suggestionId, feedbackType, suggestionType) => {
    await submitFeedback(suggestionId, feedbackType, suggestionType, {
      demo: true,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4} textAlign="center">
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          AI Feedback System Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={2}>
          Interactive feedback buttons for AI suggestions - similar to GitHub's interface
        </Typography>
        
        {stats.total > 0 && (
          <Alert severity="info" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
            <strong>Feedback Stats:</strong> {stats.total} total, {stats.accepted} accepted, {stats.rejected} rejected 
            ({stats.acceptanceRate}% acceptance rate)
          </Alert>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Default Variant */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Psychology color="primary" />
                <Typography variant="h5">Default Feedback Interface</Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" mb={3}>
                This is the default feedback interface, similar to GitHub's suggestion feedback system.
                It provides clear context and confirmation messages.
              </Typography>
              
              <AIFeedbackButtons
                suggestionId="demo_default"
                suggestionType="demo_suggestion"
                onFeedback={handleFeedback}
                variant="default"
                initialFeedback={feedbackStates['demo_default']}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Compact Variant */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Security color="warning" />
                <Typography variant="h6">Compact Variant</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Perfect for tight spaces like anomaly snapshots and activity cards.
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2}>
                <Chip label="AI Confidence: 87%" color="success" size="small" />
                <AIFeedbackButtons
                  suggestionId="demo_compact"
                  suggestionType="anomaly_detection"
                  onFeedback={handleFeedback}
                  variant="compact"
                  initialFeedback={feedbackStates['demo_compact']}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Inline Variant */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Analytics color="info" />
                <Typography variant="h6">Inline Variant</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Integrates seamlessly within text content and descriptions.
                <AIFeedbackButtons
                  suggestionId="demo_inline"
                  suggestionType="text_suggestion"
                  onFeedback={handleFeedback}
                  variant="inline"
                  initialFeedback={feedbackStates['demo_inline']}
                />
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Example */}
        <Grid item xs={12}>
          <Card
            sx={{
              border: feedbackStates['demo_analytics'] === 'accept'
                ? '2px solid #10b981'
                : feedbackStates['demo_analytics'] === 'reject'
                ? '2px solid #ef4444'
                : '1px solid',
              borderColor: feedbackStates['demo_analytics'] ? 'transparent' : 'divider',
              transition: 'all 0.3s ease'
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Timeline color="primary" />
                  <Typography variant="h6">Analytics Dashboard Integration</Typography>
                  {feedbackStates['demo_analytics'] && (
                    <Chip
                      size="small"
                      label={feedbackStates['demo_analytics'] === 'accept' ? 'Helpful' : 'Needs improvement'}
                      color={feedbackStates['demo_analytics'] === 'accept' ? 'success' : 'warning'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                <AIFeedbackButtons
                  suggestionId="demo_analytics"
                  suggestionType="analytics_insights"
                  onFeedback={handleFeedback}
                  variant="compact"
                  initialFeedback={feedbackStates['demo_analytics']}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" mb={3}>
                Example of how feedback buttons integrate with analytics dashboards and charts - similar to GitHub's suggestion interface.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Typography variant="h4" color="warning.main">24</Typography>
                    <Typography variant="caption">Anomalies</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Typography variant="h4" color="error.main">0.23</Typography>
                    <Typography variant="caption">Error Rate</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Typography variant="h4" color="info.main">8</Typography>
                    <Typography variant="caption">Peak Activity</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={1}>
                    <Typography variant="h4" color="primary.main">156</Typography>
                    <Typography variant="caption">Data Points</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* GitHub-style Interface Demo */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'info.light', border: '1px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'info.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  AI
                </Box>
                <Typography variant="h6">GitHub-Style AI Suggestion Interface</Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" mb={3}>
                This interface mimics GitHub's suggestion system, providing users with clear accept/reject options for AI-generated insights.
              </Typography>

              <AIFeedbackButtons
                suggestionId="github_style_demo"
                suggestionType="interface_demo"
                onFeedback={handleFeedback}
                variant="default"
                initialFeedback={feedbackStates['github_style_demo']}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Implementation Notes */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Implementation Features
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>✅ Features Implemented:</Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>GitHub-style accept/reject interface</li>
                    <li>Three feedback variants (default, compact, inline)</li>
                    <li>Persistent state management with localStorage</li>
                    <li>API integration with fallback handling</li>
                    <li>Loading states and confirmation messages</li>
                    <li>Visual feedback with borders and colors</li>
                    <li>Duplicate submission prevention</li>
                    <li>Feedback statistics tracking</li>
                  </ul>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>🎯 Integration Points:</Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Anomaly Snapshots component</li>
                    <li>Activity Feed cards</li>
                    <li>Analytics dashboard charts</li>
                    <li>AI-generated insights and recommendations</li>
                    <li>Security alerts and notifications</li>
                  </ul>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FeedbackDemo;

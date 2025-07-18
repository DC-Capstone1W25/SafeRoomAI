// src/screens/Analytics.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  Warning,
  Assessment,
  Timeline
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import '../App.css';
import { format } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import StatsCard from '../components/StatsCard';
import AnomalyChart from '../components/anomalychart';
import AnomalyHeatmap from '../components/anomalyheatmap';
import AnomalySnapshots from '../components/anomalysnapshots';
import AIFeedbackButtons from '../components/AIFeedbackButtons';
import useFeedbackState from '../hooks/useFeedbackState';

export default function Analytics() {
  const [summary, setSummary] = useState([]);
  const [errors, setErrors] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');



  // Use the feedback state hook
  const { feedbackStates, submitFeedback } = useFeedbackState('analytics');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch anomalies‐per‐minute summary
      const res1 = await fetch('/predict/analytics/summary');
      if (!res1.ok) throw new Error(`Summary HTTP ${res1.status}`);
      const summaryJson = await res1.json();
      if (summaryJson && typeof summaryJson === 'object' && !Array.isArray(summaryJson)) {
        const summaryArr = Object.entries(summaryJson).map(([time, count]) => ({
          time,
          count,
          formattedTime: format(new Date(time), 'HH:mm')
        }));
        setSummary(summaryArr);
      } else {
        setSummary([]);
      }

      // Fetch recent reconstruction errors
      const res2 = await fetch('/predict/analytics/errors');
      if (!res2.ok) throw new Error(`Errors HTTP ${res2.status}`);
      const errorsJson = await res2.json();
      if (Array.isArray(errorsJson)) {
        setErrors(errorsJson);
      } else {
        setErrors([]);
      }

      setErrorMsg(null);
    } catch (e) {
      console.error('Analytics fetch error:', e);
      setErrorMsg('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalAnomalies = summary.reduce((sum, item) => sum + item.count, 0);
  const avgErrorRate = errors.length > 0 ? (errors.reduce((sum, err) => sum + err, 0) / errors.length).toFixed(4) : 0;
  const maxAnomaliesPerMinute = summary.length > 0 ? Math.max(...summary.map(item => item.count)) : 0;

  // Prepare error distribution data
  const errorDistribution = errors.map((error, index) => ({
    index: index + 1,
    value: parseFloat(error.toFixed(4)),
    category: error > 0.5 ? 'High' : error > 0.2 ? 'Medium' : 'Low'
  }));

  const handleFeedback = async (suggestionId, feedbackType, suggestionType) => {
    await submitFeedback(suggestionId, feedbackType, suggestionType, {
      analytics_data: {
        total_anomalies: totalAnomalies,
        avg_error_rate: avgErrorRate,
        time_range: timeRange
      }
    });
  };



  if (loading) {
    return <LoadingSpinner message="Loading analytics data..." />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }} className="analytics-container">
      <Box mb={4} className="analytics-section">
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time insights and anomaly detection metrics
        </Typography>
      </Box>

      {/* Controls */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="1h">Last Hour</MenuItem>
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
          </Select>
        </FormControl>
        <IconButton onClick={fetchData} disabled={loading}>
          <Refresh />
        </IconButton>
        <Chip
          icon={<Assessment />}
          label={`${summary.length} data points`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {errorMsg && (
        <ErrorAlert
          message={errorMsg}
          onRetry={fetchData}
          sx={{ mb: 3 }}
        />
      )}

      {/* Statistics Cards */}
      <Box mb={4}>
        <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Anomalies"
            value={totalAnomalies}
            subtitle="Detected events"
            icon={<Warning />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Avg Error Rate"
            value={avgErrorRate}
            subtitle="Reconstruction error"
            icon={<TrendingUp />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Peak Activity"
            value={maxAnomaliesPerMinute}
            subtitle="Max per minute"
            icon={<Timeline />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Data Points"
            value={errors.length}
            subtitle="Error samples"
            icon={<Assessment />}
            color="primary"
          />
        </Grid>
        </Grid>
      </Box>

      {/* AI Analytics Feedback Section */}
      <Box mb={3}>
        <Card
          sx={{
            p: 2,
            backgroundColor: 'background.default',
            border: feedbackStates['analytics_summary'] === 'accept'
              ? '2px solid #10b981'
              : feedbackStates['analytics_summary'] === 'reject'
              ? '2px solid #ef4444'
              : '1px solid',
            borderColor: feedbackStates['analytics_summary'] ? 'transparent' : 'divider',
            transition: 'all 0.3s ease'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" gutterBottom>
                  AI Analytics Insights
                </Typography>
                {feedbackStates['analytics_summary'] && (
                  <Chip
                    size="small"
                    label={feedbackStates['analytics_summary'] === 'accept' ? 'Helpful' : 'Needs improvement'}
                    color={feedbackStates['analytics_summary'] === 'accept' ? 'success' : 'warning'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                These metrics are generated by our AI anomaly detection system
              </Typography>
            </Box>
            <Box sx={{ minWidth: '300px' }}>
              <AIFeedbackButtons
                suggestionId="analytics_summary"
                suggestionType="analytics_insights"
                onFeedback={handleFeedback}
                variant="default"
                initialFeedback={feedbackStates['analytics_summary']}
              />
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Real-time Charts */}
      <Box mb={4}>
        <Grid container spacing={3}>
        {/* Anomalies Timeline Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Anomalies Timeline
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Anomaly detections over time
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={summary}>
                  <XAxis
                    dataKey="formattedTime"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return format(new Date(payload[0].payload.time), 'MMM dd, yyyy HH:mm');
                      }
                      return label;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1976d2"
                    strokeWidth={2}
                    dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Distribution Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Reconstruction error levels
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={errorDistribution}>
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => [value.toFixed(4), 'Error Rate']}
                  />
                  <Bar
                    dataKey="value"
                    fill="#1976d2"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time Anomaly Charts - Your Custom Components */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Security Anomaly Chart
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Was this chart helpful?
                  </Typography>
                  <AIFeedbackButtons
                    suggestionId="anomaly_chart"
                    suggestionType="anomaly_visualization"
                    onFeedback={handleFeedback}
                    variant="compact"
                    initialFeedback={feedbackStates['anomaly_chart']}
                  />
                </Box>
              </Box>
              <AnomalyChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Activity Heatmap
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Was this heatmap helpful?
                  </Typography>
                  <AIFeedbackButtons
                    suggestionId="activity_heatmap"
                    suggestionType="heatmap_visualization"
                    onFeedback={handleFeedback}
                    variant="compact"
                    initialFeedback={feedbackStates['activity_heatmap']}
                  />
                </Box>
              </Box>
              <AnomalyHeatmap />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className="analytics-section">
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" gutterBottom>
                  Snapshot of Anomalies
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Are these snapshots helpful?
                  </Typography>
                  <AIFeedbackButtons
                    suggestionId="anomaly_snapshots"
                    suggestionType="anomaly_snapshots"
                    onFeedback={handleFeedback}
                    variant="compact"
                    initialFeedback={feedbackStates['anomaly_snapshots']}
                  />
                </Box>
              </Box>
              <AnomalySnapshots />
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      </Box>

      {/* Overall Analytics Feedback Section */}
      <Box mb={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
          <Card
            sx={{
              p: 3,
              backgroundColor: 'info.light',
              border: '2px solid',
              borderColor: 'info.main'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'info.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  AI
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  How was your analytics experience?
                </Typography>
              </Box>

              <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth="600px">
                Your feedback helps us improve our AI-powered analytics and anomaly detection system.
                Let us know if the insights and visualizations were helpful for your security monitoring needs.
              </Typography>

              <AIFeedbackButtons
                suggestionId="overall_analytics_experience"
                suggestionType="analytics_experience"
                onFeedback={handleFeedback}
                variant="default"
                initialFeedback={feedbackStates['overall_analytics_experience']}
              />
            </Box>
          </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}


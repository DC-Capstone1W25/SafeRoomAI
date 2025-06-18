// src/screens/Analytics.jsx

import React, { useState, useEffect } from 'react';
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

export default function Analytics() {
  const [summary, setSummary] = useState([]);
  const [errors, setErrors] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

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



  if (loading) {
    return <LoadingSpinner message="Loading analytics data..." />;
  }

  return (
    <Container maxWidth="xl">
      <Box mb={3}>
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
      <Grid container spacing={3} mb={4}>
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
              <Typography variant="h6" gutterBottom>
                Security Anomaly Chart
              </Typography>
              <AnomalyChart />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Heatmap
              </Typography>
              <AnomalyHeatmap />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Snapshot of Anomalies
              </Typography>
              <AnomalySnapshots />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}


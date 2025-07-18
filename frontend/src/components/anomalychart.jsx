// frontend\src\components\anomalychart.jsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function AnomalyChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnomalyData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/predict/analytics/summary');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // **Transform** object→array
        const points = Array.isArray(data)
          ? data
          : Object.entries(data).map(([time, count]) => ({ time, count }));
        setChartData(points);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch anomaly data:', err);
        setError('Failed to load data');
        // fallback array is already in correct format
        setChartData([
          { time: '9AM', count: 1 },
          { time: '10AM', count: 3 },
          { time: '11AM', count: 2 },
          { time: '12PM', count: 5 },
          { time: '1PM', count: 2 },
          { time: '2PM', count: 4 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnomalyData();
    const interval = setInterval(fetchAnomalyData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="chart-loading">Loading anomaly data...</div>;
  }

  const data = {
    labels: chartData.map(item => item.time),
    datasets: [
      {
        label: 'Anomalies Detected',
        data: chartData.map(item => item.count),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.3,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ef4444',
        pointRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Time' }
      },
      y: {
        display: true,
        title: { display: true, text: 'Anomaly Count' },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="anomaly-chart-container">
      {error && <div className="chart-error">⚠️ {error} (showing fallback data)</div>}
      <Line data={data} options={options} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import '../App.css';

const AnomalyHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/predict/analytics/heatmap');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setHeatmapData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch heatmap data:', err);
        setError('Failed to load data');
        // Fallback to mock data if API fails
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 10),
          intensity: Math.random()
        }));
        setHeatmapData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();

    // Set up polling for real-time updates every 60 seconds
    const interval = setInterval(fetchHeatmapData, 60000);

    return () => clearInterval(interval);
  }, []);

  const getIntensityColor = (count, maxCount) => {
    if (count === 0) return 'rgba(239, 68, 68, 0.1)';
    const intensity = count / maxCount;
    return `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`;
  };

  const getIntensityClass = (count, maxCount) => {
    if (count === 0) return 'heatmap-cell-empty';
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'heatmap-cell-high';
    if (intensity > 0.4) return 'heatmap-cell-medium';
    return 'heatmap-cell-low';
  };

  if (loading) {
    return <div className="chart-loading">Loading heatmap data...</div>;
  }

  const maxCount = Math.max(...heatmapData.map(item => item.count || 0));

  return (
    <div className="anomaly-heatmap-container">
      {error && <div className="chart-error">⚠️ {error} (showing fallback data)</div>}
      <div className="heatmap-grid">
        {heatmapData.map((item, i) => (
          <div
            key={i}
            className={`heatmap-cell ${getIntensityClass(item.count || 0, maxCount)}`}
            style={{
              backgroundColor: getIntensityColor(item.count || 0, maxCount),
              width: '24px',
              height: '24px',
              margin: '2px',
              borderRadius: '4px',
              display: 'inline-block',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={`Hour ${item.hour || i}: ${item.count || 0} anomalies`}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          ></div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="legend-label">Activity Level:</span>
        <div className="legend-scale">
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: 'rgba(239, 68, 68, 0.1)'}}></div>
            <span>Low</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: 'rgba(239, 68, 68, 0.5)'}}></div>
            <span>Medium</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{backgroundColor: 'rgba(239, 68, 68, 1)'}}></div>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyHeatmap;

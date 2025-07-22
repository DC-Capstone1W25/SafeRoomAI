import React, { useState, useEffect } from 'react';
import AIFeedbackButtons from './AIFeedbackButtons';
import feedbackService from '../services/feedbackService';

const AnomalySnapshots = () => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackStates, setFeedbackStates] = useState({});

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setLoading(true);
        const response = await fetch('/predict/analytics/snapshots');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setSnapshots(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch snapshots data:', err);
        setError('Failed to load data');
        // Fallback to mock data if API fails
        const now = new Date();
        const mockSnapshots = [
          {
            id: 1,
            time: new Date(now.getTime() - 15 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            img: '/static.png',
            confidence: 0.85,
            type: 'Motion Detection'
          },
          {
            id: 2,
            time: new Date(now.getTime() - 8 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            img: '/static.png',
            confidence: 0.92,
            type: 'Object Recognition'
          },
          {
            id: 3,
            time: new Date(now.getTime() - 2 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            img: '/static.png',
            confidence: 0.78,
            type: 'Unusual Activity'
          },
        ];
        setSnapshots(mockSnapshots);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();

    // Set up polling for real-time updates every 45 seconds
    const interval = setInterval(fetchSnapshots, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleImageError = (e) => {
    e.target.src = '/static.png'; // Fallback to existing static image
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const handleFeedback = async (suggestionId, feedbackType, suggestionType, event) => {
    // Simple event prevention
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      await feedbackService.submitFeedback(suggestionId, feedbackType, suggestionType, {
        confidence: snapshots.find(s => s.id === suggestionId)?.confidence,
        anomaly_type: snapshots.find(s => s.id === suggestionId)?.type
      });

      setFeedbackStates(prev => ({
        ...prev,
        [suggestionId]: feedbackType
      }));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="chart-loading" style={{ padding: '40px', textAlign: 'center' }}>
        Loading snapshots...
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="no-snapshots" style={{ padding: '40px', textAlign: 'center', minHeight: '200px' }}>
        <p>No recent anomaly snapshots available</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          The system will display anomaly snapshots here when they are detected.
        </p>
      </div>
    );
  }

  return (
    <div
      className="anomaly-snapshots-container"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        minHeight: '200px',
        maxHeight: '300px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {error && <div className="chart-error">⚠️ {error} (showing fallback data)</div>}
      <div
        className="snapshots-grid"
        style={{
          scrollBehavior: 'smooth',
          position: 'relative'
        }}
      >
        {snapshots.map((snap) => (
          <div key={snap.id} className="snapshot-item">
            <div className="snapshot-image-container">
              <img
                src={snap.img || snap.image_url || '/static.png'}
                alt={`Anomaly at ${snap.time}`}
                className="snapshot-image"
                onError={handleImageError}
                style={{
                  width: '150px',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxShadow: feedbackStates[snap.id] === 'accept'
                    ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                    : feedbackStates[snap.id] === 'reject'
                    ? '0 2px 8px rgba(239, 68, 68, 0.3)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  border: feedbackStates[snap.id] === 'accept'
                    ? '2px solid #10b981'
                    : feedbackStates[snap.id] === 'reject'
                    ? '2px solid #ef4444'
                    : '2px solid #e5e7eb',
                  transition: 'all 0.3s ease'
                }}
              />
              {snap.confidence && (
                <div
                  className="confidence-badge"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: getConfidenceColor(snap.confidence),
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  {Math.round(snap.confidence * 100)}%
                </div>
              )}

              {/* Feedback status indicator */}
              {feedbackStates[snap.id] && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    backgroundColor: feedbackStates[snap.id] === 'accept' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '8px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  {feedbackStates[snap.id] === 'accept' ? '✓' : '✗'}
                  {feedbackStates[snap.id] === 'accept' ? 'Helpful' : 'Not helpful'}
                </div>
              )}
            </div>
            <div className="snapshot-info">
              <div className="snapshot-time" style={{fontSize: '12px', fontWeight: 'bold', marginTop: '4px'}}>
                {snap.time}
              </div>
              {snap.type && (
                <div className="snapshot-type" style={{fontSize: '10px', color: '#6b7280', marginTop: '2px'}}>
                  {snap.type}
                </div>
              )}

              {/* AI Feedback Buttons */}
              <div style={{ marginTop: '8px' }}>
                <AIFeedbackButtons
                  suggestionId={snap.id}
                  suggestionType="anomaly_detection"
                  onFeedback={handleFeedback}
                  variant="compact"
                  initialFeedback={feedbackStates[snap.id]}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomalySnapshots;

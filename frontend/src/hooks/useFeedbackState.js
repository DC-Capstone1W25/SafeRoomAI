// src/hooks/useFeedbackState.js
import { useState, useEffect } from 'react';
import feedbackService from '../services/feedbackService';

/**
 * Custom hook for managing AI feedback state
 * Provides persistent feedback state management with localStorage backup
 */
export const useFeedbackState = (componentName = 'default') => {
  const [feedbackStates, setFeedbackStates] = useState({});
  const [loading, setLoading] = useState(false);

  // Load initial feedback states from localStorage
  useEffect(() => {
    const loadStoredFeedback = () => {
      try {
        const stored = localStorage.getItem(`ai_feedback_${componentName}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setFeedbackStates(parsed);
        }
      } catch (error) {
        console.error('Failed to load stored feedback:', error);
      }
    };

    loadStoredFeedback();
  }, [componentName]);

  // Save feedback states to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        `ai_feedback_${componentName}`, 
        JSON.stringify(feedbackStates)
      );
    } catch (error) {
      console.error('Failed to save feedback to localStorage:', error);
    }
  }, [feedbackStates, componentName]);

  /**
   * Submit feedback for a suggestion
   */
  const submitFeedback = async (suggestionId, feedbackType, suggestionType, metadata = {}) => {
    setLoading(true);
    try {
      await feedbackService.submitFeedback(suggestionId, feedbackType, suggestionType, {
        component: componentName,
        ...metadata
      });
      
      setFeedbackStates(prev => ({
        ...prev,
        [suggestionId]: feedbackType
      }));

      return { success: true };
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get feedback for a specific suggestion
   */
  const getFeedback = (suggestionId) => {
    return feedbackStates[suggestionId] || null;
  };

  /**
   * Check if feedback has been submitted for a suggestion
   */
  const hasFeedback = (suggestionId) => {
    return suggestionId in feedbackStates;
  };

  /**
   * Clear all feedback for this component
   */
  const clearFeedback = () => {
    setFeedbackStates({});
    localStorage.removeItem(`ai_feedback_${componentName}`);
  };

  /**
   * Get feedback statistics for this component
   */
  const getFeedbackStats = () => {
    const feedbackValues = Object.values(feedbackStates);
    const total = feedbackValues.length;
    const accepted = feedbackValues.filter(f => f === 'accept').length;
    const rejected = feedbackValues.filter(f => f === 'reject').length;
    
    return {
      total,
      accepted,
      rejected,
      acceptanceRate: total > 0 ? (accepted / total * 100).toFixed(1) : 0
    };
  };

  /**
   * Bulk load feedback from server (useful for initialization)
   */
  const loadFeedbackFromServer = async (suggestionIds) => {
    setLoading(true);
    try {
      const promises = suggestionIds.map(id => feedbackService.getFeedback(id));
      const results = await Promise.all(promises);
      
      const serverFeedback = {};
      results.forEach((result, index) => {
        if (result && result.feedback_type) {
          serverFeedback[suggestionIds[index]] = result.feedback_type;
        }
      });

      setFeedbackStates(prev => ({
        ...prev,
        ...serverFeedback
      }));

      return { success: true, count: Object.keys(serverFeedback).length };
    } catch (error) {
      console.error('Failed to load feedback from server:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    feedbackStates,
    loading,
    submitFeedback,
    getFeedback,
    hasFeedback,
    clearFeedback,
    getFeedbackStats,
    loadFeedbackFromServer
  };
};

export default useFeedbackState;

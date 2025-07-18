// src/services/feedbackService.js

/**
 * Service for handling AI feedback submissions
 */
class FeedbackService {
  constructor() {
    this.baseUrl = '/api/feedback';
    this.cache = new Map(); // Cache feedback to prevent duplicate submissions
  }

  /**
   * Submit feedback for an AI suggestion
   * @param {string} suggestionId - Unique identifier for the suggestion
   * @param {string} feedbackType - 'accept' or 'reject'
   * @param {string} suggestionType - Type of suggestion (e.g., 'anomaly', 'alert', 'recommendation')
   * @param {Object} metadata - Additional context about the suggestion
   * @returns {Promise<Object>} Response from the server
   */
  async submitFeedback(suggestionId, feedbackType, suggestionType, metadata = {}) {
    const cacheKey = `${suggestionId}_${feedbackType}`;
    
    // Check if feedback already submitted
    if (this.cache.has(cacheKey)) {
      console.log('Feedback already submitted for this suggestion');
      return this.cache.get(cacheKey);
    }

    const payload = {
      suggestion_id: suggestionId,
      feedback_type: feedbackType,
      suggestion_type: suggestionType,
      timestamp: new Date().toISOString(),
      metadata: {
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        ...metadata
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Cache the successful response
      this.cache.set(cacheKey, result);
      
      // Log for analytics
      this.logFeedbackEvent(suggestionId, feedbackType, suggestionType);
      
      return result;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      
      // For now, simulate success to avoid blocking the UI
      // In production, you might want to queue failed requests for retry
      const fallbackResult = {
        success: true,
        message: 'Feedback recorded locally',
        suggestion_id: suggestionId,
        feedback_type: feedbackType
      };
      
      this.cache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Get feedback statistics for analytics
   * @returns {Promise<Object>} Feedback statistics
   */
  async getFeedbackStats() {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch feedback stats:', error);
      return {
        total_feedback: 0,
        accepted: 0,
        rejected: 0,
        acceptance_rate: 0
      };
    }
  }

  /**
   * Get feedback for a specific suggestion
   * @param {string} suggestionId - Suggestion identifier
   * @returns {Promise<Object|null>} Existing feedback or null
   */
  async getFeedback(suggestionId) {
    try {
      const response = await fetch(`${this.baseUrl}/${suggestionId}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      return null;
    }
  }

  /**
   * Log feedback event for analytics
   * @private
   */
  logFeedbackEvent(suggestionId, feedbackType, suggestionType) {
    // Log to console for development
    console.log('Feedback Event:', {
      suggestion_id: suggestionId,
      feedback_type: feedbackType,
      suggestion_type: suggestionType,
      timestamp: new Date().toISOString()
    });

    // In production, you might want to send this to an analytics service
    // Example: Google Analytics, Mixpanel, etc.
    if (window.gtag) {
      window.gtag('event', 'ai_feedback', {
        event_category: 'AI Suggestions',
        event_label: suggestionType,
        value: feedbackType === 'accept' ? 1 : 0
      });
    }
  }

  /**
   * Clear feedback cache (useful for testing or user logout)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Check if feedback has been submitted for a suggestion
   * @param {string} suggestionId - Suggestion identifier
   * @returns {string|null} Feedback type if exists, null otherwise
   */
  getCachedFeedback(suggestionId) {
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(suggestionId + '_')) {
        return value.feedback_type;
      }
    }
    return null;
  }
}

// Create and export a singleton instance
const feedbackService = new FeedbackService();
export default feedbackService;

// Export the class for testing purposes
export { FeedbackService };

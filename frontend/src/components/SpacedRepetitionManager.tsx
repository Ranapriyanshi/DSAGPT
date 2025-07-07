import React, { useState, useEffect } from 'react';
import ChatFab from './ChatFab';

interface SpacedRepetitionTopic {
  id: number;
  topic_id: number;
  topic_title: string;
  next_review: string;
  review_count: number;
  success_rate: number;
  difficulty_level: number;
  days_until_review: number;
}

const SpacedRepetitionManager: React.FC = () => {
  const [topics, setTopics] = useState<SpacedRepetitionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<SpacedRepetitionTopic | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSpacedRepetitionTopics();
    } else {
      setError('No authentication token. Please log in first.');
      setLoading(false);
    }
  }, []);

  const fetchSpacedRepetitionTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching spaced repetition topics with token:', token.substring(0, 20) + '...');

      const response = await fetch('http://127.0.0.1:8000/personalization/spaced-repetition', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          localStorage.removeItem('token');
        } else {
          throw new Error(`Failed to fetch spaced repetition topics: ${response.status} ${errorText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      // Transform the data to include days_until_review
      const topics = data.topics || data;
      const transformedTopics = topics.map((topic: any) => ({
        ...topic,
        days_until_review: Math.ceil((new Date(topic.next_review).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));
      
      setTopics(transformedTopics);
    } catch (err) {
      console.error('Error fetching spaced repetition topics:', err);
      setError(`Failed to load spaced repetition topics: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (topicId: number, success: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/personalization/spaced-repetition/${topicId}/review?success=${success}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark topic as reviewed');
      }

      // Refresh topics after review
      await fetchSpacedRepetitionTopics();
      setShowReviewModal(false);
      setSelectedTopic(null);
    } catch (err) {
      setError('Failed to mark topic as reviewed');
      console.error('Error marking topic as reviewed:', err);
    }
  };

  const handleDifficultyAdjust = async (topicId: number, adjustment: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      // Find the current topic
      const currentTopic = topics.find(topic => topic.topic_id === topicId);
      if (!currentTopic) return;

      // Calculate new difficulty level
      const newDifficulty = Math.max(1, Math.min(5, currentTopic.difficulty_level + adjustment));

      // Update the topic in state
      setTopics(prev => prev.map(topic => 
        topic.topic_id === topicId 
          ? { ...topic, difficulty_level: newDifficulty }
          : topic
      ));

      // In a real implementation, you would send this to the backend
      console.log(`Adjusting difficulty for topic ${topicId} by ${adjustment}`);
    } catch (err) {
      setError('Failed to adjust difficulty');
      console.error('Error adjusting difficulty:', err);
    }
  };

  const getPriorityColor = (daysUntilReview: number) => {
    if (daysUntilReview <= 0) return 'text-red-600 bg-red-100';
    if (daysUntilReview <= 1) return 'text-orange-600 bg-orange-100';
    if (daysUntilReview <= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityText = (daysUntilReview: number) => {
    if (daysUntilReview <= 0) return 'Due Now';
    if (daysUntilReview <= 1) return 'Due Soon';
    if (daysUntilReview <= 3) return 'Due This Week';
    return 'Upcoming';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading spaced repetition topics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => fetchSpacedRepetitionTopics()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium mr-3"
            >
              Try Again
            </button>
            {error.includes('authentication') || error.includes('token') ? (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Go to Login
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Spaced Repetition</h1>
          
          {topics.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No topics due for review</h3>
              <p className="text-gray-600">Great job! You're all caught up with your spaced repetition schedule.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => (
                <div key={topic.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{topic.topic_title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(topic.days_until_review)}`}>
                      {getPriorityText(topic.days_until_review)}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Review Count:</span>
                      <span className="font-semibold">{topic.review_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-semibold">{Math.round(topic.success_rate * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className="font-semibold">{topic.difficulty_level}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Days Until Review:</span>
                      <span className={`font-semibold ${topic.days_until_review <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {topic.days_until_review <= 0 ? 'Overdue' : topic.days_until_review}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        setSelectedTopic(topic);
                        setShowReviewModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Review Now
                    </button>
                    <button
                      onClick={() => handleDifficultyAdjust(topic.topic_id, 1)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      title="Increase Difficulty"
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => handleDifficultyAdjust(topic.topic_id, -1)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      title="Decrease Difficulty"
                    >
                      ⬇️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedTopic && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Review Topic</h2>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTopic.topic_title}</h3>
                <p className="text-gray-600">How well did you understand this topic?</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleReview(selectedTopic.topic_id, true)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold"
                >
                  ✅ I understood it well
                </button>
                <button
                  onClick={() => handleReview(selectedTopic.topic_id, false)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold"
                >
                  ❌ I need more practice
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedTopic(null);
                  }}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Chat Icon - Fixed Position */}
      <ChatFab />
    </div>
  );
};

export default SpacedRepetitionManager; 
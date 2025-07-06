import React, { useState, useEffect } from 'react';

interface LearningPathItem {
  order: number;
  question_id: number;
  title: string;
  difficulty: string;
  difficulty_adjustment: number;
  estimated_duration: number;
  completed: boolean;
}

interface LearningPath {
  learning_path: LearningPathItem[];
}

const LearningPathManager: React.FC = () => {
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLearningPath();
  }, []);

  const fetchLearningPath = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token. Please log in first.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/personalization/learning-path', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch learning path: ${response.status}`);
      }

      const data: LearningPath = await response.json();
      setLearningPath(data.learning_path || []);
    } catch (err) {
      console.error('Error fetching learning path:', err);
      setError(`Failed to load learning path: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'basic': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your personalized learning path...</p>
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
          <button
            onClick={fetchLearningPath}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/20">
          <div className="text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Personalized Learning Path</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              This path is tailored to your learning style, cognitive profile, and current progress. 
              Follow it step by step for optimal learning outcomes.
            </p>
          </div>
        </div>

        {/* Learning Path */}
        <div className="space-y-6">
          {learningPath.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Learning Path Available</h3>
              <p className="text-gray-600 mb-6">
                Complete your personalization settings to generate a custom learning path.
              </p>
              <button
                onClick={() => window.location.href = '/personalization'}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
              >
                Set Up Personalization
              </button>
            </div>
          ) : (
            learningPath.map((item, index) => (
              <div
                key={item.question_id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 ${
                  item.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      item.completed 
                        ? 'bg-green-500' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}>
                      {item.completed ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(item.difficulty)}`}>
                          {getDifficultyIcon(item.difficulty)} {item.difficulty}
                        </span>
                        {item.difficulty_adjustment !== 0 && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.difficulty_adjustment > 0 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.difficulty_adjustment > 0 ? '↗' : '↘'} Adjusted
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>⏱️ {item.estimated_duration} min</span>
                        <span>📊 Step {item.order}</span>
                        {item.completed && <span className="text-green-600 font-semibold">✓ Completed</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!item.completed && (
                      <button
                        onClick={() => window.location.href = `/questions/${item.question_id}/solve`}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => window.location.href = `/questions/${item.question_id}/solve`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {item.completed ? 'Review' : 'Preview'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Progress Summary */}
        {learningPath.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Progress Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{learningPath.length}</div>
                <div className="text-sm text-gray-600">Total Topics</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {learningPath.filter(item => item.completed).length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {learningPath.length > 0 ? Math.round((learningPath.filter(item => item.completed).length / learningPath.length) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600">Progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningPathManager; 
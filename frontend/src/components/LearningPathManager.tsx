import React, { useState, useEffect } from 'react';
import { apiUrl } from '../api';

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

interface LearningPathManagerProps {
  onClose: () => void;
}

const LearningPathManager: React.FC<LearningPathManagerProps> = ({ onClose }) => {
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

      const response = await fetch(apiUrl('personalization/learning-path'), {
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

  // Modal loading and error states
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-lg w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your personalized learning path...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-lg w-full text-center">
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

  // Modal main content
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 max-w-3xl w-full max-h-[90vh] flex flex-col p-0">
        {/* Cross button, always on top */}
        <div className="sticky top-0 left-0 z-30 flex justify-end p-4 bg-transparent">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none bg-white/80 rounded-full w-10 h-10 flex items-center justify-center shadow"
            aria-label="Close"
            style={{ zIndex: 30 }}
          >
            &times;
          </button>
        </div>
        {/* Decorative background elements inside modal */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-10 animate-gentlePulse pointer-events-none"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-10 animate-gentlePulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-10 left-20 w-12 h-12 bg-green-200 rounded-full opacity-10 animate-gentlePulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-10 h-10 bg-orange-200 rounded-full opacity-10 animate-gentlePulse pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-indigo-200 rounded-full opacity-10 animate-gentlePulse pointer-events-none" style={{ animationDelay: '1.5s' }}></div>
        <div className="relative z-10 flex-1 overflow-y-auto pt-2 px-4 pb-6 md:pt-4 md:px-8 md:pb-8">
          {/* Main Card: Header, Question List, Progress Summary all in one */}
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-2 text-3xl md:text-4xl">🗺️</span> Learning Path
            </h1>
            <p className="text-sm text-gray-600">Your personalized, step-by-step journey to DSA mastery</p>
          </div>
          {/* Question List */}
          {learningPath.length === 0 ? (
            <div className="text-center">
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
            <div className="space-y-2 mb-6">
              {learningPath.map((item, index) => (
                <div
                  key={item.question_id}
                  className={`flex flex-col md:flex-row items-center justify-between gap-2 bg-white/90 rounded-xl shadow p-4 border border-white/20 hover:shadow-xl transition-all duration-300 ${item.completed ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${item.completed ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>{item.completed ? '✓' : index + 1}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900 truncate max-w-xs">{item.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getDifficultyColor(item.difficulty)}`}>{getDifficultyIcon(item.difficulty)} {item.difficulty}</span>
                        {item.difficulty_adjustment !== 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.difficulty_adjustment > 0 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{item.difficulty_adjustment > 0 ? '↗' : '↘'} Adjusted</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                        <span>⏱️ {item.estimated_duration} min</span>
                        <span>📊 Step {item.order}</span>
                        {item.completed && <span className="text-green-600 font-semibold">✓ Completed</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
              ))}
            </div>
          )}
          {/* Progress Summary */}
          {learningPath.length > 0 && (
            <div className="bg-white/70 rounded-xl p-4 border border-white/10">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center"><span className="mr-2 text-lg">📊</span> Progress Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{learningPath.length}</div>
                  <div className="text-sm text-gray-600">Total Topics</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{learningPath.filter(item => item.completed).length}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{learningPath.length > 0 ? Math.round((learningPath.filter(item => item.completed).length / learningPath.length) * 100) : 0}%</div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPathManager; 
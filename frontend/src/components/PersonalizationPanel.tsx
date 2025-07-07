import React, { useState, useEffect } from 'react';
import ChatFab from './ChatFab';

interface LearningStyle {
  visual_preference: number;
  auditory_preference: number;
  kinesthetic_preference: number;
  reading_preference: number;
}

interface CognitiveProfile {
  working_memory_capacity: number;
  processing_speed: number;
  attention_span: number;
  pattern_recognition: number;
  logical_reasoning: number;
  spatial_ability: number;
}

interface LearningStyleRequest {
  visual_preference: number;
  auditory_preference: number;
  kinesthetic_preference: number;
  reading_preference: number;
}

interface CognitiveProfileRequest {
  working_memory_capacity: number;
  processing_speed: number;
  attention_span: number;
  pattern_recognition: number;
  logical_reasoning: number;
  spatial_ability: number;
}

interface PersonalizationPanelProps {
  onUpdateLearningStyle: (style: LearningStyleRequest) => void;
  onUpdateCognitiveProfile: (profile: CognitiveProfileRequest) => void;
}

const PersonalizationPanel: React.FC<PersonalizationPanelProps> = ({
  onUpdateLearningStyle,
  onUpdateCognitiveProfile
}) => {
  const [learningStyle, setLearningStyle] = useState<LearningStyle>({
    visual_preference: 0.5,
    auditory_preference: 0.5,
    kinesthetic_preference: 0.5,
    reading_preference: 0.5
  });

  const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile>({
    working_memory_capacity: 0.5,
    processing_speed: 0.5,
    attention_span: 0.5,
    pattern_recognition: 0.5,
    logical_reasoning: 0.5,
    spatial_ability: 0.5
  });

  const [activeTab, setActiveTab] = useState<'learning-style' | 'cognitive-profile'>('learning-style');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPersonalizationData();
  }, []);

  const fetchPersonalizationData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [learningStyleRes, cognitiveProfileRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/personalization/learning-style', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://127.0.0.1:8000/personalization/cognitive-profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (learningStyleRes.ok) {
        const learningStyleData = await learningStyleRes.json();
        setLearningStyle(learningStyleData);
      }

      if (cognitiveProfileRes.ok) {
        const cognitiveProfileData = await cognitiveProfileRes.json();
        setCognitiveProfile(cognitiveProfileData);
      }
    } catch (error) {
      console.error('Error fetching personalization data:', error);
    }
  };

  const handleLearningStyleUpdate = async () => {
    setLoading(true);
    setMessage('');
    try {
      await onUpdateLearningStyle(learningStyle);
      setMessage('Learning style updated successfully!');
    } catch (error) {
      setMessage('Error updating learning style');
    } finally {
      setLoading(false);
    }
  };

  const handleCognitiveProfileUpdate = async () => {
    setLoading(true);
    setMessage('');
    try {
      await onUpdateCognitiveProfile(cognitiveProfile);
      setMessage('Cognitive profile updated successfully!');
    } catch (error) {
      setMessage('Error updating cognitive profile');
    } finally {
      setLoading(false);
    }
  };

  const getLearningStyleDescription = (style: string) => {
    switch (style) {
      case 'visual_preference':
        return 'Prefer visual explanations, diagrams, and charts';
      case 'auditory_preference':
        return 'Learn best through listening and verbal explanations';
      case 'kinesthetic_preference':
        return 'Learn by doing and hands-on practice';
      case 'reading_preference':
        return 'Prefer reading and written explanations';
      default:
        return '';
    }
  };

  const getCognitiveDescription = (trait: string) => {
    switch (trait) {
      case 'working_memory_capacity':
        return 'Ability to hold and manipulate information in mind';
      case 'processing_speed':
        return 'Speed of information processing and decision making';
      case 'attention_span':
        return 'Ability to maintain focus over time';
      case 'pattern_recognition':
        return 'Ability to identify patterns and relationships';
      case 'logical_reasoning':
        return 'Ability to think logically and solve problems';
      case 'spatial_ability':
        return 'Ability to visualize and manipulate spatial information';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative background elements for consistency with chat */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-green-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-indigo-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="max-w-4xl mx-auto my-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          {/* Title and Subtitle in one row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="mr-2 text-2xl">🎨</span> Personalization
              </h1>
              <p className="text-sm text-gray-600">Customize your learning experience based on your preferences and cognitive profile</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4 bg-gray-100 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('learning-style')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                activeTab === 'learning-style'
                  ? 'bg-white text-blue-600 shadow border border-blue-200'
                  : 'text-gray-600 hover:text-blue-700'
              }`}
            >
              🎨 Learning Style
            </button>
            <button
              onClick={() => setActiveTab('cognitive-profile')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors text-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                activeTab === 'cognitive-profile'
                  ? 'bg-white text-blue-600 shadow border border-blue-200'
                  : 'text-gray-600 hover:text-blue-700'
              }`}
            >
              🧠 Cognitive Profile
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-3 rounded-xl border text-base font-medium flex items-center gap-2 ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {message.includes('Error') ? <span className="text-2xl">❌</span> : <span className="text-2xl">✅</span>}
              {message}
            </div>
          )}

          {/* Learning Style Tab */}
          {activeTab === 'learning-style' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Learning Style Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {Object.entries(learningStyle).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
                    <span className="font-medium text-gray-800 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-500 text-sm">{getLearningStyleDescription(key)}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={value}
                      onChange={e => setLearningStyle({ ...learningStyle, [key]: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 mt-2"
                    />
                    <span className="text-blue-600 font-semibold">{Math.round(value * 100)}%</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleLearningStyleUpdate}
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Learning Style'}
              </button>
            </div>
          )}

          {/* Cognitive Profile Tab */}
          {activeTab === 'cognitive-profile' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Cognitive Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {Object.entries(cognitiveProfile).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
                    <span className="font-medium text-gray-800 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-gray-500 text-sm">{getCognitiveDescription(key)}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={value}
                      onChange={e => setCognitiveProfile({ ...cognitiveProfile, [key]: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 mt-2"
                    />
                    <span className="text-blue-600 font-semibold">{Math.round(value * 100)}%</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCognitiveProfileUpdate}
                disabled={loading}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Cognitive Profile'}
              </button>
            </div>
          )}
        </div>
      </div>
      <ChatFab />
    </div>
  );
};

export default PersonalizationPanel; 
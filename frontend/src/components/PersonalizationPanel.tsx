import React, { useState, useEffect } from 'react';

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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Personalization Settings</h2>
        <p className="text-gray-600">Customize your learning experience based on your preferences and cognitive profile.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('learning-style')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'learning-style'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🎨 Learning Style
        </button>
        <button
          onClick={() => setActiveTab('cognitive-profile')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'cognitive-profile'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🧠 Cognitive Profile
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Learning Style Tab */}
      {activeTab === 'learning-style' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Learning Style Preferences</h3>
            <p className="text-gray-600 mb-6">Adjust these sliders to reflect how you prefer to learn. The system will adapt its teaching style accordingly.</p>
          </div>

          {Object.entries(learningStyle).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace('_', ' ')}
                </label>
                <span className="text-sm text-gray-500">{Math.round(value * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={value}
                onChange={(e) => setLearningStyle(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-gray-500">{getLearningStyleDescription(key)}</p>
            </div>
          ))}

          <button
            onClick={handleLearningStyleUpdate}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Learning Style'}
          </button>
        </div>
      )}

      {/* Cognitive Profile Tab */}
      {activeTab === 'cognitive-profile' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cognitive Profile</h3>
            <p className="text-gray-600 mb-6">These settings help the system understand your cognitive strengths and adapt the learning pace and complexity.</p>
          </div>

          {Object.entries(cognitiveProfile).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace('_', ' ')}
                </label>
                <span className="text-sm text-gray-500">{Math.round(value * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={value}
                onChange={(e) => setCognitiveProfile(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-gray-500">{getCognitiveDescription(key)}</p>
            </div>
          ))}

          <button
            onClick={handleCognitiveProfileUpdate}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Cognitive Profile'}
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">How This Affects Your Learning</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Learning style preferences determine how explanations are presented</li>
          <li>• Cognitive profile affects the pace and complexity of content</li>
          <li>• The system adapts in real-time based on your emotional responses</li>
          <li>• Your preferences are remembered across sessions</li>
        </ul>
      </div>
    </div>
  );
};

export default PersonalizationPanel; 
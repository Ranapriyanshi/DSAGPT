import React, { useState, useEffect } from 'react';

interface SessionState {
  isPaused: boolean;
  pauseReason?: string;
  pauseId?: number;
  currentMode: 'visual' | 'text' | 'analogy';
  currentDifficulty: number;
}

const SessionControls: React.FC = () => {
  const [sessionState, setSessionState] = useState<SessionState>({
    isPaused: false,
    currentMode: 'text',
    currentDifficulty: 0.5
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReasonInput, setPauseReasonInput] = useState('');

  useEffect(() => {
    fetchSessionState();
  }, []);

  const fetchSessionState = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        setLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/personalization/session-state', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet, use default state
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSessionState(data);
    } catch (err) {
      // If endpoint doesn't exist yet, use default state
      console.log('Session state endpoint not available yet, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (reason: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/personalization/pause-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to pause session');
      }

      const data = await response.json();
      setSessionState(prev => ({
        ...prev,
        isPaused: true,
        pauseReason: reason,
        pauseId: data.pause_id
      }));
      setShowPauseModal(false);
      setPauseReasonInput('');
    } catch (err) {
      setError('Failed to pause session');
      console.error('Error pausing session:', err);
    }
  };

  const handleResume = async (pauseId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      const response = await fetch(`http://127.0.0.1:8000/personalization/resume-session/${pauseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to resume session');
      }

      setSessionState(prev => ({
        ...prev,
        isPaused: false,
        pauseReason: undefined,
        pauseId: undefined
      }));
    } catch (err) {
      setError('Failed to resume session');
      console.error('Error resuming session:', err);
    }
  };

  const handleDifficultyChange = async (adjustment: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      const newDifficulty = Math.max(0, Math.min(1, sessionState.currentDifficulty + adjustment));

      const response = await fetch('http://127.0.0.1:8000/personalization/update-difficulty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ difficulty: newDifficulty })
      });

      if (!response.ok) {
        throw new Error('Failed to update difficulty');
      }

      setSessionState(prev => ({
        ...prev,
        currentDifficulty: newDifficulty
      }));
    } catch (err) {
      setError('Failed to update difficulty');
      console.error('Error updating difficulty:', err);
    }
  };

  const handleModeChange = async (mode: 'visual' | 'text' | 'analogy') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/personalization/update-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mode })
      });

      if (!response.ok) {
        throw new Error('Failed to update mode');
      }

      setSessionState(prev => ({
        ...prev,
        currentMode: mode
      }));
    } catch (err) {
      setError('Failed to update mode');
      console.error('Error updating mode:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading session controls...</p>
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
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Session Controls</h1>

          {/* Session Status */}
          <div className="mb-8">
            <div className={`p-6 rounded-xl border-2 ${sessionState.isPaused ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Session Status: {sessionState.isPaused ? 'Paused' : 'Active'}
                  </h3>
                  {sessionState.isPaused && sessionState.pauseReason && (
                    <p className="text-gray-600 mt-2">Reason: {sessionState.pauseReason}</p>
                  )}
                </div>
                <div className="text-2xl">
                  {sessionState.isPaused ? '⏸️' : '▶️'}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pause/Resume Controls */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Control</h3>
              {sessionState.isPaused ? (
                <button
                  onClick={() => sessionState.pauseId && handleResume(sessionState.pauseId)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold"
                >
                  Resume Session
                </button>
              ) : (
                <button
                  onClick={() => setShowPauseModal(true)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold"
                >
                  Pause Session
                </button>
              )}
            </div>

            {/* Difficulty Control */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficulty Level</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDifficultyChange(-0.1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Easier
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-semibold text-gray-900">
                    {Math.round(sessionState.currentDifficulty * 100)}%
                  </span>
                </div>
                <button
                  onClick={() => handleDifficultyChange(0.1)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Harder
                </button>
              </div>
            </div>

            {/* Learning Mode */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Mode</h3>
              <div className="space-y-2">
                {(['visual', 'text', 'analogy'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                      sessionState.currentMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                  </button>
                ))}
              </div>
            </div>

            {/* Current Settings */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Settings</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Mode:</span>
                  <span className="ml-2 font-semibold text-gray-900 capitalize">{sessionState.currentMode}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Difficulty:</span>
                  <span className="ml-2 font-semibold text-gray-900">{Math.round(sessionState.currentDifficulty * 100)}%</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 font-semibold ${sessionState.isPaused ? 'text-red-600' : 'text-green-600'}`}>
                    {sessionState.isPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pause Modal */}
        {showPauseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Pause Session</h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for pausing (optional):
                </label>
                <textarea
                  value={pauseReasonInput}
                  onChange={(e) => setPauseReasonInput(e.target.value)}
                  placeholder="e.g., Need a break, feeling tired, etc."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePause(pauseReasonInput)}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold"
                  >
                    Pause Session
                  </button>
                  <button
                    onClick={() => {
                      setShowPauseModal(false);
                      setPauseReasonInput('');
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionControls; 
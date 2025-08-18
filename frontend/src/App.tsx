import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { marked } from 'marked';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';
import EmotionAwareChat from './components/EmotionAwareChat';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import BookmarkManager from './components/BookmarkManager';
import SessionControls from './components/SessionControls';
import SpacedRepetitionManager from './components/SpacedRepetitionManager';
import PersonalizationPanel from './components/PersonalizationPanel';
import LearningPathManager from './components/LearningPathManager';
import ChatFab from './components/ChatFab';
import { apiUrl } from './api';

// Define a Message type
interface Message {
  sender: 'user' | 'bot';
  text: string;
  sentiment?: number;
  quiz?: Quiz | null;
  quizAnswered?: boolean;
  quizCorrect?: boolean;
}

interface Quiz {
  question: string;
  options: string[];
  answer: number; // index of correct option
}

// Add prop type for Dashboard
interface DashboardProps {
  onOpenSessionControls?: () => void;
  onOpenLearningPath?: () => void;
}

// At the top of App.tsx, add a type for navItems
type NavItem = { path: string; label: string; icon: string; onClick?: () => void };

function Login({ setShowLoginModal, setShowRegisterModal }: { setShowLoginModal: (show: boolean) => void; setShowRegisterModal: (show: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(apiUrl('users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        window.location.href = '/dashboard';
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <form className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4 border border-white/20" onSubmit={handleSubmit}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> DSA-GPT</span>
          </h1>
          <p className="text-gray-600">Sign in to continue your learning journey</p>
        </div>

        {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>}

        <div className="space-y-4">
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 font-semibold text-lg shadow-lg"
          type="submit"
        >
          Sign In
        </button>
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors underline" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

function Register({ setShowLoginModal, setShowRegisterModal }: { setShowLoginModal: (show: boolean) => void; setShowRegisterModal: (show: boolean) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('Python');
  const [dsaLevel, setDsaLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(apiUrl('users/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, preferred_language: preferredLanguage, dsa_level: dsaLevel })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Registration successful! You can now log in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <form className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-4 max-w-sm w-full mx-4 border border-white/20" onSubmit={handleSubmit}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> DSA-GPT</span>
          </h1>
          <p className="text-gray-600">Start your personalized DSA learning journey</p>
        </div>

        {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>}
        {success && <div className="text-green-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">{success}</div>}

        <div className="space-y-4">
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <select
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            value={preferredLanguage}
            onChange={e => setPreferredLanguage(e.target.value)}
          >
            <option>Python</option>
            <option>C++</option>
            <option>JavaScript</option>
          </select>
          <select
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            value={dsaLevel}
            onChange={e => setDsaLevel(e.target.value)}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <button
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 font-semibold text-lg shadow-lg"
          type="submit"
        >
          Register
        </button>
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors underline" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}>
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}

function Dashboard({ onOpenSessionControls, onOpenLearningPath }: DashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ attempted: number, solved: number, percent: number }>({ attempted: 0, solved: 0, percent: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(apiUrl('users/me'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('token');
          navigate('/login');
          return Promise.reject('Unauthorized or user not found');
        }
        return res.ok ? res.json() : Promise.reject(res);
      })
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => { setError('Failed to load user info'); setLoading(false); });

    // Fetch user progress from backend
    fetch(apiUrl('questions/progress'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        const attempted = Object.values(data).filter((v: any) => v.attempted).length;
        const solved = Object.values(data).filter((v: any) => v.solved).length;
        // Get total number of questions from backend (for all languages/difficulties)
        fetch(apiUrl('questions'), { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res2 => res2.ok ? res2.json() : Promise.reject(res2))
          .then(allQuestions => {
            const total = allQuestions.length * 3; // 3 languages per question
            const percent = total ? Math.round((solved / total) * 100) : 0;
            setProgress({ attempted, solved, percent });
          })
          .catch(() => setProgress({ attempted, solved, percent: 0 }));
      })
      .catch(() => setProgress({ attempted: 0, solved: 0, percent: 0 }));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-10 animate-gentlePulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-green-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-indigo-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{user.name}</span>! 👋
                </h1>
                <p className="text-sm text-gray-600">Ready to continue your DSA learning journey?</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Level</p>
                  <p className="font-semibold text-gray-900">{user.dsa_level}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Language</p>
                  <p className="font-semibold text-gray-900">{user.preferred_language}</p>
                </div>
                {onOpenSessionControls && (
                  <button
                    onClick={onOpenSessionControls}
                    className="ml-4 px-4 py-2 rounded-xl font-medium text-sm shadow-sm border border-blue-200 text-blue-600 bg-blue-50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-white hover:shadow-md hover:text-blue-700 transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
                  >
                    Session Controls
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUpBouncy" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                  <p className="text-lg font-bold text-blue-600">{progress.percent}%</p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress.percent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUpBouncy" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Problems Solved</p>
                  <p className="text-lg font-bold text-green-600">{progress.solved}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUpBouncy" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Problems Attempted</p>
                  <p className="text-lg font-bold text-purple-600">{progress.attempted}</p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUpBouncy" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-lg font-bold text-orange-600">
                    {progress.attempted > 0 ? Math.round((progress.solved / progress.attempted) * 100) : 0}%
                  </p>
                </div>
                <div className="text-3xl">🏆</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <div className="lg:col-span-1 animate-fadeInUpBouncy" style={{ animationDelay: '0.5s' }}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300">
                <h2 className="text-base font-bold mb-4 flex items-center">
                  <span className="mr-3 text-lg">👤</span>
                  Your Profile
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600 mr-3">👤</span>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-600 mr-3">📧</span>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600 mr-3">💻</span>
                    <div>
                      <p className="text-sm text-gray-600">Preferred Language</p>
                      <p className="font-semibold text-gray-900">{user.preferred_language}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-600 mr-3">📚</span>
                    <div>
                      <p className="text-sm text-gray-600">DSA Level</p>
                      <p className="font-semibold text-gray-900">{user.dsa_level}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 animate-fadeInUpBouncy" style={{ animationDelay: '0.6s' }}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <h2 className="text-base font-bold mb-6 flex items-center">
                  <span className="mr-3 text-lg">🚀</span>
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    to="/chat"
                    className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">💬</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Start Chat</h3>
                      <p className="text-xs text-gray-600">Talk to your AI tutor and get personalized help</p>
                    </div>
                  </Link>

                  <Link
                    to="/questions"
                    className="group p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 hover:border-green-400 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Practice Problems</h3>
                      <p className="text-xs text-gray-600">Solve DSA questions and improve your skills</p>
                    </div>
                  </Link>

                  <Link
                    to="/analytics"
                    className="group p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">View Analytics</h3>
                      <p className="text-xs text-gray-600">Track your progress and learning insights</p>
                    </div>
                  </Link>

                  <Link
                    to="/bookmarks"
                    className="group p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">🔖</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">My Bookmarks</h3>
                      <p className="text-xs text-gray-600">Access your saved questions and explanations</p>
                    </div>
                  </Link>

                  <Link
                    to="/spaced-repetition"
                    className="group p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl border-2 border-teal-200 hover:border-teal-400 hover:from-teal-100 hover:to-teal-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">🔄</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Spaced Repetition</h3>
                      <p className="text-xs text-gray-600">Review topics at optimal intervals</p>
                    </div>
                  </Link>

                  {/* Replace Session Controls Link with button if prop provided */}
                  {onOpenSessionControls ? (
                    <button
                      type="button"
                      onClick={onOpenSessionControls}
                      className="group p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full text-left"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">⚙️</div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Session Controls</h3>
                        <p className="text-xs text-gray-600">Manage your learning session settings</p>
                      </div>
                    </button>
                  ) : (
                    <Link
                      to="/session-controls"
                      className="group p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">⚙️</div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Session Controls</h3>
                        <p className="text-xs text-gray-600">Manage your learning session settings</p>
                      </div>
                    </Link>
                  )}

                  <Link
                    to="/personalization"
                    className="group p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl border-2 border-pink-200 hover:border-pink-400 hover:from-pink-100 hover:to-pink-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">🎨</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Personalization</h3>
                      <p className="text-xs text-gray-600">Customize your learning experience</p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={onOpenLearningPath}
                    className="group p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-2 border-yellow-200 hover:border-yellow-400 hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full text-left"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-3 group-hover:scale-110 transition-transform">🗺️</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Learning Path</h3>
                      <p className="text-xs text-gray-600">Follow your personalized learning journey</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Section */}
        <div className="mt-12 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 m-12 text-white relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative z-10">
              <div className="text-center">
                <div className="text-3xl mb-4">🚀</div>
                <h2 className="text-lg font-bold mb-4">Ready to Level Up?</h2>
                <p className="text-sm text-blue-100 mb-6 max-w-lg mx-auto">
                  {progress.percent < 30 ?
                    "You're just getting started! Let's build a strong foundation together." :
                    progress.percent < 70 ?
                      "Great progress! You're well on your way to becoming a DSA expert." :
                      "Amazing work! You're almost there. Keep pushing forward!"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/questions"
                    className="px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Start Practicing
                  </Link>
                  <Link
                    to="/chat"
                    className="px-4 py-2 border-2 border-white text-white rounded-xl font-semibold text-sm hover:bg-white hover:text-blue-600 transition-all duration-200"
                  >
                    Ask AI Tutor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatFab />
    </div>
  );
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hi! Ask me anything about Data Structures & Algorithms.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confusedCount, setConfusedCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const confused = /confused|don\'t get|don\'t understand|lost|stuck/i.test(input);
    if (confused) setConfusedCount(c => c + 1);
    const userMsg: Message = { sender: 'user', text: input, quiz: null };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    // Sentiment analysis (mocked)
    const sentimentRes = await fetch(apiUrl('sentiment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });
    const sentiment = (await sentimentRes.json()).sentiment;
    // Chat response (mocked, with quiz and adaptive tone)
    let botText = '';
    let quiz: Quiz | null = null;
    if (confusedCount + (confused ? 1 : 0) >= 3) {
      botText = "I see you're having some trouble. Let's try an easier topic, like 'Arrays'. Would you like to start with a simple example or a visual explanation?";
      setConfusedCount(0); // reset after suggestion
    } else if (confused) {
      botText = "No worries! Let's try a simpler explanation and more examples. Arrays are like lists of items in order. For example: arr = [1, 2, 3]. Would you like to see a visual or more code samples?";
    } else {
      const chatRes = await fetch(apiUrl('gpt-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await chatRes.json();
      botText = data.response;
      if (botText.toLowerCase().includes('array')) {
        quiz = {
          question: 'Which of the following is a valid way to declare an array in Python?',
          options: ['arr = [1, 2, 3]', 'array arr = [1, 2, 3]', 'arr = array(1,2,3)', 'int arr[3] = {1,2,3}'],
          answer: 0
        };
      }
    }
    setMessages(msgs => [...msgs, { sender: 'bot', text: botText, sentiment, quiz }]);
    setLoading(false);
  };

  // Handle quiz answer
  const handleQuizAnswer = (msgIdx: number, optionIdx: number) => {
    setMessages(msgs => msgs.map((msg, i) => {
      if (i !== msgIdx) return msg;
      const correct = msg.quiz && optionIdx === msg.quiz.answer;
      return { ...msg, quizAnswered: true, quizCorrect: !!correct };
    }));
  };

  // Calculate session summary
  const quizResults = messages.filter(m => m.quizAnswered);
  const correctCount = quizResults.filter(m => m.quizCorrect).length;
  const totalQuizzes = quizResults.length;
  const avgSentiment = messages.filter(m => m.sentiment !== undefined).reduce((sum, m) => sum + (m.sentiment || 0), 0) / (messages.filter(m => m.sentiment !== undefined).length || 1);

  return (
    <div className="h-full flex flex-col pb-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-[70%] ${msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'}`}>
              <div className="text-xs text-gray-500 mb-1">{msg.sender === 'user' ? 'You' : 'DSA-GPT'}</div>
              <div>{msg.text}</div>
              {msg.sentiment !== undefined && (
                <div className="text-xs mt-1 text-gray-400">Sentiment: {msg.sentiment}</div>
              )}
              {/* Quiz rendering */}
              {msg.quiz && !msg.quizAnswered && (
                <div className="mt-3">
                  <div className="font-semibold mb-2">Quiz: {msg.quiz.question}</div>
                  <div className="space-y-2">
                    {msg.quiz.options.map((opt, idx) => (
                      <button
                        key={idx}
                        className="block w-full text-left border rounded px-3 py-2 hover:bg-blue-50"
                        onClick={() => handleQuizAnswer(i, idx)}
                        disabled={msg.quizAnswered}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msg.quiz && msg.quizAnswered && (
                <div className={`mt-2 font-semibold ${msg.quizCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {msg.quizCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${msg.quiz.options[msg.quiz.answer]}`}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex flex-col gap-3 pt-2 border-t mt-2">
        <form className="flex gap-2" onSubmit={sendMessage}>
          <input
            className="flex-1 border rounded p-2"
            placeholder="Type your question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>
            {loading ? '...' : 'Send'}
          </button>
        </form>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded w-full mt-1 mb-5"
          onClick={() => setShowSummary(true)}
        >
          End Session & Show Summary
        </button>
      </div>
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowSummary(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Session Summary</h2>
            <div className="mb-2">Quiz Score: <span className="font-semibold">{correctCount} / {totalQuizzes}</span></div>
            <div className="mb-2">Average Sentiment: <span className="font-semibold">{avgSentiment.toFixed(2)}</span></div>
            <div className="mb-2">Emotional Trend: <span className="font-semibold">{avgSentiment > 0.2 ? '😊 Positive' : avgSentiment < -0.2 ? '😟 Negative' : '😐 Neutral'}</span></div>
            <div className="mt-4 text-sm text-gray-500">Thank you for learning with DSA-GPT!</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Questions({ onOpenLearningPath }: { onOpenLearningPath?: () => void }) {
  const [difficulty, setDifficulty] = useState('basic');
  const [language, setLanguage] = useState('Python');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(apiUrl(`questions/?difficulty=${difficulty}&language=${encodeURIComponent(language)}`))
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => { setQuestions(data); setLoading(false); })
      .catch(() => { setError('Failed to load questions'); setLoading(false); });
  }, [difficulty, language]);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'basic': return 'from-green-500 to-green-600';
      case 'intermediate': return 'from-yellow-500 to-orange-600';
      case 'advanced': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getDifficultyIcon = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'basic': return '🌱';
      case 'intermediate': return '🔥';
      case 'advanced': return '⚡';
      default: return '📝';
    }
  };

  const getLanguageIcon = (lang: string) => {
    switch (lang) {
      case 'Python': return '🐍';
      case 'C++': return '⚡';
      case 'JavaScript': return '🟨';
      default: return '💻';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-10 animate-gentlePulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-green-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-indigo-200 rounded-full opacity-10 animate-gentlePulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Practice <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">DSA Problems</span>
                </h1>
                <p className="text-sm text-gray-600">Master Data Structures & Algorithms with hands-on practice</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                {onOpenLearningPath && (
                  <button
                    onClick={onOpenLearningPath}
                    className="ml-4 px-4 py-2 rounded-xl font-medium text-sm shadow-sm border border-blue-200 text-blue-600 bg-blue-50
      hover:bg-gradient-to-r hover:from-blue-100 hover:to-white hover:shadow-md
      hover:text-blue-700 transform hover:scale-[1.02] transition-all duration-200 ease-in-out"
                  >
                    View Personalized Learning Path
                  </button>
                )}

                {/* <div className="text-right">
                  <p className="text-sm text-gray-600">Total Questions</p>
                  <p className="font-semibold text-gray-900">{questions.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Level</p>
                  <p className="font-semibold text-gray-900">{difficulty}</p>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 mb-8 animate-fadeInUp">
            <h2 className="text-base font-bold mb-6 flex items-center">
              <span className="mr-3 text-lg">🔍</span>
              Filter Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty Level</label>
                <select
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option value="basic">🌱 Basic</option>
                  <option value="intermediate">🔥 Intermediate</option>
                  <option value="advanced">⚡ Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Programming Language</label>
                <select
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  <option value="Python">🐍 Python</option>
                  <option value="C++">⚡ C++</option>
                  <option value="JavaScript">🟨 JavaScript</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="all">📚 All Categories</option>
                  <option value="arrays">📊 Arrays & Strings</option>
                  <option value="linkedlists">🔗 Linked Lists</option>
                  <option value="trees">🌳 Trees & Graphs</option>
                  <option value="dp">⚡ Dynamic Programming</option>
                  <option value="sorting">🔄 Sorting & Searching</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading questions...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">Oops! Something went wrong</h3>
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && questions.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <div className="text-blue-500 text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-blue-800 mb-2">No questions found</h3>
                <p className="text-blue-600">Try adjusting your filters to find more questions.</p>
              </div>
            )}

            {questions.map((q, i) => (
              <div
                key={q.id || i}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">{q.title}</h3>
                      <p className="hidden md:block text-gray-600 text-sm leading-relaxed mb-4">{q.description}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className={`px-4 py-2 rounded-full text-white text-sm font-semibold bg-gradient-to-r ${getDifficultyColor(q.difficulty)}`}>
                        {getDifficultyIcon(q.difficulty)} {q.difficulty}
                      </div>
                      <div className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                        {getLanguageIcon(q.language)} {q.language}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className="mr-1">⏱️</span>
                        <span className="hidden sm:inline">Estimated: 15-30 min</span>
                        <span className="sm:hidden">15-30 min</span>
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">👥</span>
                        <span className="hidden sm:inline">Popular</span>
                      </span>
                    </div>
                    <button
                      className="w-full sm:w-auto px-4 md:px-5 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                      onClick={() => navigate(`/questions/${q.id}/solve`)}
                    >
                      Start Solving →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ChatFab />
    </div>
  );
}

// MermaidRenderer: renders Mermaid code blocks as diagrams
function MermaidRenderer({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        mermaid.initialize({ startOnLoad: false });
        mermaid.render('mermaid-svg-' + Math.random().toString(36).substr(2, 9), code)
          .then(({ svg }) => {
            if (ref.current) ref.current.innerHTML = svg;
          });
      } catch (e) {
        if (ref.current) ref.current.innerHTML = '<pre style="color:red">Invalid Mermaid diagram</pre>';
      }
    }
  }, [code]);
  return <div ref={ref} className="my-4" />;
}

function SolveQuestion() {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [examples, setExamples] = useState<any[]>([]);
  const [approach, setApproach] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('');
  const [spaceComplexity, setSpaceComplexity] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [user, setUser] = useState<any>(null);
  const [aiDetail, setAiDetail] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAIDetail, setShowAIDetail] = useState(false);
  const token = localStorage.getItem('token');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(apiUrl(`questions/${id}/summary`))
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setQuestion(data);
        setExamples(data.examples || []);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load question'); setLoading(false); });
    // Fetch user info for personalized chat
    if (token) {
      fetch(apiUrl('users/me'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setUser(data))
        .catch(() => setUser(null));
    }
  }, [id, token]);

  // Handler for Explain in more detail
  const handleExplainDetail = async () => {
    if (!question) return;
    setAiLoading(true);
    setAiError('');
    setShowAIDetail(true);
    fetch(apiUrl('ai/question-detail'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: question.title, description: question.description })
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(ai => { setAiDetail(ai.detail); setAiLoading(false); })
      .catch(() => { setAiError('Failed to load AI explanation'); setAiLoading(false); });
  };

  // Handler for "Check the approach" button (to be wired up to backend in next step)
  const handleCheckApproach = async () => {
    setSubmitting(true);
    setCheckResult(null);
    // Placeholder: just show a mock response for now
    setTimeout(() => {
      setCheckResult({
        feedback: '😄 Well done! This is a solid approach. Ready to move to coding?',
        hint: '',
        correct: true
      });
      setSubmitting(false);
    }, 1200);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!question) return null;

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full min-h-screen px-0 md:px-6 relative">
      {/* Left: Question & Approach Area (70%) */}

      <div className="flex-[7] min-w-0 w-full md:w-[70%] pr-0 md:pr-6">
        <h2 className="text-xl font-bold mb-2">{question.title}</h2>
        <div className="text-xs text-gray-500 mb-2">Difficulty: {question.difficulty} | Language: {question.language}</div>
        <div className="mb-2 text-gray-700">{question.description}</div>
        {examples.length > 0 && (
          <div className="mb-4">
            <div className="font-semibold mb-1">Examples:</div>
            <ul className="space-y-2">
              {examples.map((ex, idx) => (
                <li key={idx} className="bg-blue-50 rounded p-3 border border-blue-100">
                  <div><span className="font-semibold">Sample Input {idx + 1}:</span> <span className="font-mono">{ex.input}</span></div>
                  <div><span className="font-semibold">Output:</span> <span className="font-mono">{ex.output}</span></div>
                  {ex.explanation && <div className="text-xs text-gray-600 mt-1">{ex.explanation}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          className="mb-4 px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition font-medium"
          type="button"
          onClick={handleExplainDetail}
        >
          Explain in more detail
        </button>

        {showAIDetail && (
          <>
            {aiLoading && <div className="mb-2 text-blue-600">AI is generating a detailed explanation...</div>}
            {aiError && <div className="mb-2 text-red-600">{aiError}</div>}
            {aiDetail && (
              <div className="mb-4 prose prose-sm max-w-none">
                <div className="p-8 bg-gray-200 dark:bg-black text-black dark:text-white">
                  TEST DARK MODE
                </div>
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      if (match && match[1] === 'mermaid') {
                        return <MermaidRenderer code={String(children).trim()} />;
                      }
                      return <code className={className} {...props}>{children}</code>;
                    }
                  }}
                >
                  {aiDetail}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}
        <div className="mb-4">
          <label className="font-semibold block mb-1">Explain your approach to solve the question here:</label>
          <textarea
            className="w-full border rounded p-2 mt-1"
            rows={3}
            value={approach}
            onChange={e => setApproach(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="font-semibold block mb-1">Time Complexity</label>
            <input
              className="w-full border rounded p-2"
              value={timeComplexity}
              onChange={e => setTimeComplexity(e.target.value)}
              disabled={submitting}
              placeholder="e.g. O(n log n)"
            />
          </div>
          <div className="flex-1">
            <label className="font-semibold block mb-1">Space Complexity</label>
            <input
              className="w-full border rounded p-2"
              value={spaceComplexity}
              onChange={e => setSpaceComplexity(e.target.value)}
              disabled={submitting}
              placeholder="e.g. O(1)"
            />
          </div>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleCheckApproach}
          disabled={submitting || !approach.trim()}
        >
          {submitting ? 'Checking...' : 'Check the approach'}
        </button>
        <div className="pb-12" />
        {checkResult && (
          <div className={`mt-4 font-semibold ${checkResult.correct ? 'text-green-600' : 'text-red-600'}`}>
            {checkResult.feedback}
            {checkResult.hint && <div className="mt-2 text-blue-600">Hint: {checkResult.hint}</div>}
          </div>
        )}
        {/* The code editor and code submission will be added after approach is checked/approved */}
      </div>
      {/* Right: Chat Area (30%) - hidden on mobile, visible on md+ */}
      <div className="hidden md:block bg-white dark:bg-gray-800 dark:text-white rounded shadow p-6 flex-[3] min-w-0 w-full md:w-[30%] md:h-[80vh]">
        <h3 className="text-lg font-bold mb-4">Hey{user ? `, ${user.name}` : ''}! I am here to help—ask me anything about this question or DSA.</h3>
        <Chat key={id} />
      </div>
      {/* Floating chat button for mobile */}
      <button
        className="fixed md:hidden bottom-6 right-6 z-40 bg-blue-600 text-white rounded-full shadow-lg p-4 flex items-center justify-center"
        onClick={() => setChatOpen(true)}
        aria-label="Open Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0 4.556 4.694 8.25 10.125 8.25.993 0 1.956-.09 2.872-.26a.75.75 0 01.563.12l3.375 2.25a.75.75 0 001.155-.63v-2.13c0-.273.11-.535.305-.73C21.694 16.556 21.75 14.31 21.75 12c0-4.556-4.694-8.25-10.125-8.25S2.25 7.444 2.25 12z" />
        </svg>
      </button>
      {/* Chat modal for mobile */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:w-[90vw] max-w-md h-[80vh] flex flex-col relative animate-fadeInUp">
            <button
              className="absolute top-3 right-3 z-10 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setChatOpen(false)}
              aria-label="Close Chat"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="w-full h-full flex items-center justify-center text-3xl font-bold">&times;</span>
            </button>
            <div className="p-4 pb-0 flex-1 flex flex-col pr-2">
              <h3 className="text-lg font-bold mb-4">Hey{user ? `, ${user.name}` : ''}! I am here to help—ask me anything about this question or DSA.</h3>
              <Chat key={id} />
            </div>
          </div>
        </div>
      )}

      {/* Chat Icon - Fixed Position */}
      <Link
        to="/chat"
        className="fixed bottom-6 right-6 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Link>
    </div>
  );
}

// ThemeToggle component for dark mode
function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="transition-colors duration-300 rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 ml-2"
      aria-label="Toggle dark mode"
    >
      <span className={`transition-transform duration-300 text-xl ${dark ? 'rotate-12' : ''}`}>
        {dark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}

// Login Modal Component
function LoginModal({ onClose, onSuccess, setShowLoginModal, setShowRegisterModal }: { onClose: () => void; onSuccess: () => void; setShowLoginModal: (show: boolean) => void; setShowRegisterModal: (show: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(apiUrl('users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.access_token);
        onSuccess();
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-4 left-4 w-12 h-12 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-8 right-6 w-8 h-8 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-6 left-6 w-6 h-6 bg-green-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-600 hover:text-gray-800 transition-colors z-10"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <form onSubmit={handleSubmit}>
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> DSA-GPT</span>
          </h1>
          <p className="text-gray-600">Sign in to continue your learning journey</p>
        </div>

        {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>}

        <div className="space-y-4">
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="email"
            name="email"
            id="login-email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="password"
            name="password"
            id="login-password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 font-semibold text-lg shadow-lg"
          type="submit"
        >
          Sign In
        </button>
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors underline" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

// Register Modal Component
function RegisterModal({ onClose, onSuccess, setShowLoginModal, setShowRegisterModal }: { onClose: () => void; onSuccess: () => void; setShowLoginModal: (show: boolean) => void; setShowRegisterModal: (show: boolean) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('Python');
  const [dsaLevel, setDsaLevel] = useState('Beginner');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(apiUrl('users/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, preferred_language: preferredLanguage, dsa_level: dsaLevel })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Registration successful! You can now log in.');
        setTimeout(() => onSuccess(), 1500);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-4 left-4 w-12 h-12 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-8 right-6 w-8 h-8 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-6 left-6 w-6 h-6 bg-green-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 transition-colors z-10"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <form onSubmit={handleSubmit}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> DSA-GPT</span>
          </h1>
          <p className="text-gray-600">Start your personalized DSA learning journey</p>
        </div>

        {error && <div className="text-red-600 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">{error}</div>}
        {success && <div className="text-green-600 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">{success}</div>}

        <div className="space-y-4">
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="text"
            name="name"
            id="register-name"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="email"
            name="email"
            id="register-email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            type="password"
            name="password"
            id="register-password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <select
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            name="preferred_language"
            id="register-preferred-language"
            value={preferredLanguage}
            onChange={e => setPreferredLanguage(e.target.value)}
          >
            <option>Python</option>
            <option>C++</option>
            <option>JavaScript</option>
          </select>
          <select
            className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            name="dsa_level"
            id="register-dsa-level"
            value={dsaLevel}
            onChange={e => setDsaLevel(e.target.value)}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <button
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 font-semibold text-lg shadow-lg"
          type="submit"
        >
          Register
        </button>
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors underline" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}>
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}

// Landing Page Component
function LandingPage({
  showLoginModal,
  setShowLoginModal,
  showRegisterModal,
  setShowRegisterModal
}: {
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                Master DSA with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> AI-Powered</span>
                <br />
                Emotion-Aware Tutoring
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                DSA-GPT is an intelligent tutoring system that adapts to your emotional state,
                providing personalized learning experiences for Data Structures & Algorithms.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-600 hover:text-white transition-all duration-200"
              >
                Sign In
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">30+</div>
                <div className="text-gray-600">DSA Problems</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
                <div className="text-gray-600">Programming Languages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-600">AI Tutor Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose DSA-GPT?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our emotion-aware AI tutor provides a unique learning experience that adapts to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Emotion-Aware AI</h3>
              <p className="text-gray-600">
                Our AI detects your emotional state and adapts its teaching style to keep you engaged and motivated.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personalized Analytics</h3>
              <p className="text-gray-600">
                Track your progress with detailed analytics, emotional trends, and personalized recommendations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Interactive Quizzes</h3>
              <p className="text-gray-600">
                Test your knowledge with AI-generated quizzes that adapt to your learning level and pace.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Chat</h3>
              <p className="text-gray-600">
                Ask questions anytime and get instant, contextual responses from your AI tutor.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-xl hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Language Support</h3>
              <p className="text-gray-600">
                Learn DSA concepts in Python, C++, and JavaScript with language-specific examples.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-xl hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed progress reports and achievement tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with DSA-GPT in just a few simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Create Account</h3>
              <p className="text-gray-600">
                Sign up with your email and set your preferred programming language and DSA level.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Learning</h3>
              <p className="text-gray-600">
                Chat with your AI tutor, solve problems, and take interactive quizzes to test your knowledge.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your learning analytics, emotional trends, and get personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DSA Coverage Marquee Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 py-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8">Comprehensive DSA Coverage</h2>
        <div className="space-y-6">
          {/* First row - scrolling left */}
          <div className="marquee-container">
            <div className="marquee-track">
              {(() => {
                const topics = [
                  { name: 'Arrays & Strings', icon: '📊', color: 'from-blue-500 to-blue-600' },
                  { name: 'Linked Lists', icon: '🔗', color: 'from-purple-500 to-purple-600' },
                  { name: 'Stacks & Queues', icon: '📚', color: 'from-green-500 to-green-600' },
                  { name: 'Trees & Graphs', icon: '🌳', color: 'from-orange-500 to-orange-600' },
                  { name: 'Dynamic Programming', icon: '⚡', color: 'from-red-500 to-red-600' },
                  { name: 'Sorting Algorithms', icon: '🔄', color: 'from-indigo-500 to-indigo-600' },
                  { name: 'Searching Algorithms', icon: '🔍', color: 'from-pink-500 to-pink-600' },
                  { name: 'Hash Tables', icon: '🗂️', color: 'from-teal-500 to-teal-600' }
                ];
                return [...topics, ...topics].map((topic, index) => (
                  <div key={index} className="flex-shrink-0 mx-4">
                    <div className={`bg-gradient-to-r ${topic.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[180px] flex items-center space-x-3`}>
                      <div className="text-2xl">{topic.icon}</div>
                      <h3 className="font-semibold text-sm">{topic.name}</h3>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
          {/* Second row - scrolling right (reverse direction) */}
          <div className="marquee-container">
            <div className="marquee-track" style={{ animationDirection: 'reverse' }}>
              {(() => {
                const topics = [
                  { name: 'Binary Search', icon: '🎯', color: 'from-yellow-500 to-yellow-600' },
                  { name: 'Graph Traversal', icon: '🕸️', color: 'from-cyan-500 to-cyan-600' },
                  { name: 'Tree Traversal', icon: '🌿', color: 'from-lime-500 to-lime-600' },
                  { name: 'Heap Data Structure', icon: '🏗️', color: 'from-amber-500 to-amber-600' },
                  { name: 'Trie Data Structure', icon: '🌐', color: 'from-emerald-500 to-emerald-600' },
                  { name: 'Union Find', icon: '🔗', color: 'from-violet-500 to-violet-600' },
                  { name: 'Segment Trees', icon: '📏', color: 'from-rose-500 to-rose-600' },
                  { name: 'Binary Indexed Trees', icon: '📊', color: 'from-sky-500 to-sky-600' }
                ];
                return [...topics, ...topics].map((topic, index) => (
                  <div key={index} className="flex-shrink-0 mx-4">
                    <div className={`bg-gradient-to-r ${topic.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[180px] flex items-center space-x-3`}>
                      <div className="text-2xl">{topic.icon}</div>
                      <h3 className="font-semibold text-sm">{topic.name}</h3>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Master DSA?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who are already learning with DSA-GPT
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              Start Learning Now
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">DSA-GPT</h3>
              <p className="text-gray-400">
                Emotion-aware AI tutoring for Data Structures & Algorithms
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>AI Chat Tutor</li>
                <li>Interactive Quizzes</li>
                <li>Progress Analytics</li>
                <li>Multi-language Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Topics</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Data Structures</li>
                <li>Algorithms</li>
                <li>Problem Solving</li>
                <li>Code Optimization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DSA-GPT. All rights reserved.</p>
          </div>
        </div>
      </div>

      <ChatFab />
    </div>
  );
}

// Active link component
function NavLink({ item, sidebarCollapsed, onClick }: {
  item: { path: string; label: string; icon: string; onClick?: () => void };
  sidebarCollapsed: boolean;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  return (
    <Link
      to={item.path}
      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${sidebarCollapsed ? 'justify-center' : 'space-x-3'
        } ${isActive
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
          : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
      onClick={e => {
        if (onClick) onClick();
        if (item.onClick) {
          e.preventDefault();
          item.onClick();
        }
      }}
      title={sidebarCollapsed ? item.label : undefined}
    >
      <span className={`text-lg transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'
        }`}>
        {item.icon}
      </span>
      {!sidebarCollapsed && (
        <span className={`font-medium transition-all duration-300 delay-150 ${sidebarCollapsed ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>{item.label}</span>
      )}
    </Link>
  );
}

function App() {
  const isLoggedIn = !!localStorage.getItem('token');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showSessionControlsModal, setShowSessionControlsModal] = useState(false);
  const [showLearningPathModal, setShowLearningPathModal] = useState(false);

  // Fetch user data when logged in
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('token');
      fetch(apiUrl('users/me'), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setUser(data))
        .catch(() => setUser(null));
    }
  }, [isLoggedIn]);

  // Prevent body scrolling when modals are open
  useEffect(() => {
    if (showLoginModal || showRegisterModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLoginModal, showRegisterModal]);

  // Sidebar navigation items
  const navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/chat', label: 'AI Tutor', icon: '💬' },
    { path: '/questions', label: 'Practice Problems', icon: '📝' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/bookmarks', label: 'Bookmarks', icon: '🔖' },
    { path: '/spaced-repetition', label: 'Spaced Repetition', icon: '🔄' },
    { path: '/personalization', label: 'Personalization', icon: '🎨' },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white">
        {isLoggedIn ? (
          // Logged in layout with sidebar
          <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 h-screen bg-white dark:bg-gray-800 shadow-xl transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } lg:translate-x-0 lg:static lg:inset-0 ${sidebarCollapsed ? 'w-14' : 'w-56'
              }`}>
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col w-full">
                  {!sidebarCollapsed ? (
                    <Link to="/dashboard" className="block mb-3 w-full">
                      <div className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
                        <span className={`text-white font-bold text-xl tracking-wide transition-all duration-300 delay-150 ${sidebarCollapsed ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>DSA-GPT</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex flex-col items-center mb-3">
                      <Link to="/dashboard">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-white font-bold text-lg">D</span>
                        </div>
                      </Link>
                      <button
                        onClick={() => setSidebarCollapsed(false)}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title="Expand sidebar"
                      >
                        <svg className="w-7 h-7 block mx-auto my-auto" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between mt-2 w-full">
                      <button
                        onClick={() => setSidebarCollapsed(true)}
                        className="flex items-center px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors space-x-3 w-full"
                        title="Collapse sidebar"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7" />
                        </svg>
                        <span className="text-base font-medium text-gray-700 dark:text-gray-300">Collapse</span>
                      </button>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ml-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto w-full">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      item={item}
                      sidebarCollapsed={sidebarCollapsed}
                      onClick={() => {
                        setSidebarOpen(false);
                        if (item.onClick) {
                          item.onClick();
                        }
                      }}
                    />
                  ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {/* Theme Toggle */}
                  <div className={`flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg w-full ${sidebarCollapsed ? 'justify-center' : 'justify-between'
                    }`}>
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                    )}
                    <ThemeToggle />
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.href = '/';
                    }}
                    className={`w-full flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium ${sidebarCollapsed ? 'justify-center' : 'justify-center space-x-2'
                      }`}
                    title={sidebarCollapsed ? "Logout" : undefined}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!sidebarCollapsed && <span className="text-sm">Logout</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-0 overflow-hidden">
              {/* Top bar for mobile */}
              <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <Link to="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    DSA-GPT
                  </Link>
                  <div className="w-10"></div> {/* Spacer for centering */}
                </div>
              </div>

              {/* Page Content */}
              <main className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/dashboard" element={<DashboardWithSessionControlsTrigger onOpenSessionControls={() => setShowSessionControlsModal(true)} onOpenLearningPath={() => setShowLearningPathModal(true)} />} />
                  <Route path="/chat" element={<EmotionAwareChat />} />
                  <Route path="/questions" element={<Questions onOpenLearningPath={() => setShowLearningPathModal(true)} />} />
                  <Route path="/questions/:id/solve" element={<SolveQuestion />} />
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/bookmarks" element={<BookmarkManager />} />
                  <Route path="/spaced-repetition" element={<SpacedRepetitionManager />} />
                  <Route path="/session-controls" element={null} />
                  <Route path="/personalization" element={<PersonalizationWrapper />} />
                  <Route path="/learning-path" element={<LearningPathManager onClose={() => setShowLearningPathModal(false)} />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
                {showSessionControlsModal && (
                  <SessionControls onClose={() => setShowSessionControlsModal(false)} />
                )}
                {showLearningPathModal && (
                  <LearningPathManager onClose={() => setShowLearningPathModal(false)} />
                )}
              </main>
            </div>
          </div>
        ) : (
          // Non-logged in layout with top navbar
          <>
            <nav className="bg-blue-600 dark:bg-gray-800 text-white px-4 py-3 shadow flex items-center justify-between">
              <div className="text-2xl font-bold">
                <Link to="/">DSA-GPT</Link>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={() => setShowRegisterModal(true)} className="hover:underline bg-transparent border-none text-white cursor-pointer hidden md:inline">
                  Register
                </button>
                <button onClick={() => setShowLoginModal(true)} className="px-4 py-2 border border-white rounded-full text-white hover:bg-white hover:text-blue-600 transition-all duration-200 hidden md:inline">
                  Sign In
                </button>
                <ThemeToggle />
              </div>
            </nav>

            <main className="w-full">
              <Routes>
                <Route path="/" element={
                  <LandingPage
                    showLoginModal={showLoginModal}
                    setShowLoginModal={setShowLoginModal}
                    showRegisterModal={showRegisterModal}
                    setShowRegisterModal={setShowRegisterModal}
                  />
                } />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </>
        )}

        {/* Modals */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <LoginModal
              onClose={() => setShowLoginModal(false)}
              onSuccess={() => {
                setShowLoginModal(false);
                window.location.reload();
              }}
              setShowLoginModal={setShowLoginModal}
              setShowRegisterModal={setShowRegisterModal}
            />
          </div>
        )}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <RegisterModal
              onClose={() => setShowRegisterModal(false)}
              onSuccess={() => {
                setShowRegisterModal(false);
                window.location.reload();
              }}
              setShowLoginModal={setShowLoginModal}
              setShowRegisterModal={setShowRegisterModal}
            />
          </div>
        )}
      </div>
    </Router>
  );
}

// Personalization Wrapper Component
function PersonalizationWrapper() {
  const handleUpdateLearningStyle = async (style: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(apiUrl('personalization/learning-style'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(style)
      });

      if (!response.ok) {
        throw new Error('Failed to update learning style');
      }
    } catch (error) {
      console.error('Error updating learning style:', error);
      throw error;
    }
  };

  const handleUpdateCognitiveProfile = async (profile: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(apiUrl('personalization/cognitive-profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        throw new Error('Failed to update cognitive profile');
      }
    } catch (error) {
      console.error('Error updating cognitive profile:', error);
      throw error;
    }
  };

  return (
    <PersonalizationPanel
      onUpdateLearningStyle={handleUpdateLearningStyle}
      onUpdateCognitiveProfile={handleUpdateCognitiveProfile}
    />
  );
}

// DashboardWithSessionControlsTrigger wraps Dashboard and injects the trigger for the modal
function DashboardWithSessionControlsTrigger({ onOpenSessionControls, onOpenLearningPath }: { onOpenSessionControls: () => void; onOpenLearningPath: () => void }) {
  return <Dashboard onOpenSessionControls={onOpenSessionControls} onOpenLearningPath={onOpenLearningPath} />;
}

export default App;
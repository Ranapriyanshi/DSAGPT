import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import ReactMarkdown from 'react-markdown';
import VisualDSARenderer from './VisualDSARenderer';
import BookmarkManager from './BookmarkManager';
import { apiUrl } from '../api';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sentiment?: number;
  emotion_category?: string;
  timestamp: Date;
}

interface Quiz {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty?: string;
  topic?: string;
  hints?: string[];
}

interface ChatResponse {
  response: string;
  sentiment_score: number;
  emotion_category: string;
  quiz?: Quiz;
  should_generate_quiz: boolean;
}

const EmotionAwareChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hi! I\'m DSA-GPT, your emotion-aware AI tutor. I\'ll adapt my teaching style based on how you\'re feeling. What would you like to learn about today?',
      sentiment: 0,
      emotion_category: 'neutral',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState('');
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [quizTimer, setQuizTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [visualMode, setVisualMode] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('');
  const [currentCode, setCurrentCode] = useState<string>('');
  const [userLanguage, setUserLanguage] = useState<string>('Python');
  const [showBookmarkManager, setShowBookmarkManager] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [input, loading]);

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'neutral': return '😐';
      default: return '😐';
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);
    setTypingIndicator(true);

    // Add user message
    const newUserMessage: Message = {
      sender: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(apiUrl('chat/message'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          topic: currentTopic || 'DSA'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ChatResponse = await response.json();

      // Add bot response
      const newBotMessage: Message = {
        sender: 'bot',
        text: data.response,
        sentiment: data.sentiment_score,
        emotion_category: data.emotion_category,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newBotMessage]);

      // Detect algorithms and code for visual rendering
      const algorithmKeywords = ['bubble sort', 'quick sort', 'merge sort', 'binary search', 'linear search', 'dfs', 'bfs', 'dijkstra', 'dynamic programming'];
      const detectedAlgorithm = algorithmKeywords.find(keyword => 
        data.response.toLowerCase().includes(keyword)
      );
      
      if (detectedAlgorithm) {
        setCurrentAlgorithm(detectedAlgorithm);
        // Extract code blocks from response
        const codeBlockMatch = data.response.match(/```[\s\S]*?```/);
        if (codeBlockMatch) {
          const code = codeBlockMatch[0].replace(/```/g, '').trim();
          setCurrentCode(code);
        }
      }

      // Handle quiz if generated
      if (data.quiz && data.should_generate_quiz) {
        setCurrentQuiz(data.quiz);
        setShowQuiz(true);
        setQuizAnswered(false);
        setQuizFeedback('');
        setSelectedAnswer(null);
        setShowExplanation(false);
        setShowHint(false);
        setHintIndex(0);
        setTimeRemaining(60);
        // Start timer after a short delay
        setTimeout(() => startQuizTimer(), 1000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        sentiment: 0,
        emotion_category: 'neutral',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTypingIndicator(false);
      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleQuizAnswer = async (selectedOption: number) => {
    if (!currentQuiz || quizAnswered) return;

    setSelectedAnswer(selectedOption);
    setQuizAnswered(true);
    setLoading(true);

    // Stop timer
    if (quizTimer) {
      clearInterval(quizTimer);
      setQuizTimer(null);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(apiUrl('chat/quiz/answer'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quiz_id: currentQuiz.id,
          selected_option: selectedOption
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz answer');
      }

      const data = await response.json();
      const isCorrect = selectedOption === currentQuiz.correct_answer;
      
      // Update score
      if (isCorrect) {
        setQuizScore(prev => prev + 1);
      }
      setTotalQuizzes(prev => prev + 1);

      // Get emotion-aware feedback
      const userEmotion = messages[messages.length - 1]?.emotion_category || 'neutral';
      const emotionAwareFeedback = getEmotionAwareFeedback(isCorrect, userEmotion);
      
      setQuizFeedback(`${emotionAwareFeedback}\n\n${data.feedback}`);
      setShowExplanation(true);

      // Add quiz result to chat
      const quizResultMessage: Message = {
        sender: 'bot',
        text: `${emotionAwareFeedback}\n\n${data.feedback}`,
        sentiment: isCorrect ? 0.5 : -0.2,
        emotion_category: isCorrect ? 'positive' : 'neutral',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, quizResultMessage]);

    } catch (error) {
      console.error('Error submitting quiz answer:', error);
      setQuizFeedback('Sorry, there was an error processing your answer.');
    } finally {
      setLoading(false);
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setCurrentQuiz(null);
    setQuizAnswered(false);
    setQuizFeedback('');
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
    setHintIndex(0);
    setTimeRemaining(60);
    if (quizTimer) {
      clearInterval(quizTimer);
      setQuizTimer(null);
    }
  };

  // Timer management
  const startQuizTimer = () => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleQuizTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setQuizTimer(timer);
  };

  const handleQuizTimeout = () => {
    setQuizAnswered(true);
    setQuizFeedback('Time\'s up! Let me explain the correct answer.');
    setShowExplanation(true);
    setTotalQuizzes(prev => prev + 1);
  };

  // Hint system
  const showNextHint = () => {
    if (currentQuiz?.hints && hintIndex < currentQuiz.hints.length - 1) {
      setHintIndex(prev => prev + 1);
    }
  };

  const getEmotionAwareFeedback = (isCorrect: boolean, userEmotion: string) => {
    if (isCorrect) {
      switch (userEmotion) {
        case 'positive':
          return 'Excellent! Your confidence is showing! 🎉';
        case 'negative':
          return 'Great job! This success should boost your mood! 🌟';
        default:
          return 'Correct! Well done! 👍';
      }
    } else {
      switch (userEmotion) {
        case 'positive':
          return 'Don\'t worry! Your positive attitude will help you learn from this! 💪';
        case 'negative':
          return 'It\'s okay to make mistakes. Let\'s learn from this together! 🤗';
        default:
          return 'Not quite right, but that\'s how we learn! 📚';
      }
    }
  };

  const retryQuiz = () => {
    setQuizAnswered(false);
    setQuizFeedback('');
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
    setHintIndex(0);
    setTimeRemaining(60);
    if (quizTimer) {
      clearInterval(quizTimer);
      setQuizTimer(null);
    }
  };

  const clearChat = () => {
    setMessages([{
      sender: 'bot',
      text: 'Hi! I\'m DSA-GPT, your emotion-aware AI tutor. I\'ll adapt my teaching style based on how you\'re feeling. What would you like to learn about today?',
      sentiment: 0,
      emotion_category: 'neutral',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-green-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-indigo-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Chat Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-lg font-bold text-gray-900 mb-1">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">DSA-GPT</span> Chat
                </h1>
                <p className="text-xs text-gray-600">Emotion-aware AI tutoring system</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <span>💬</span>
                  <span>{messages.length} messages</span>
                </div>
                <button
                  onClick={() => setVisualMode(!visualMode)}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 font-semibold shadow-lg ${
                    visualMode 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' 
                      : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:from-gray-300 hover:to-gray-400'
                  }`}
                  title="Toggle visual mode"
                >
                  {visualMode ? '📊 Visual Mode' : '👁️ Visual Mode'}
                </button>
                <button
                  onClick={() => setShowBookmarkManager(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg"
                  title="Manage bookmarks"
                >
                  📌 Bookmarks
                </button>
                <button
                  onClick={clearChat}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg"
                  title="Clear chat"
                >
                  Clear Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`max-w-xs lg:max-w-2xl px-6 py-4 rounded-2xl shadow-lg ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-white/80 backdrop-blur-sm border border-white/20 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {message.sender === 'bot' && message.emotion_category && (
                    <>
                      <span className="text-lg">{getEmotionIcon(message.emotion_category)}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getEmotionColor(message.emotion_category)}`}>
                        {message.emotion_category}
                      </span>
                    </>
                  )}
                  {message.sender === 'user' && (
                    <span className="text-lg">👤</span>
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
                <div className="text-xs opacity-70 mt-3 flex items-center">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.sentiment !== undefined && (
                    <span className="ml-2">
                      Sentiment: {message.sentiment > 0 ? '+' : ''}{message.sentiment.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
          {typingIndicator && (
            <div className="flex justify-start animate-fadeInUp">
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 px-6 py-4 rounded-2xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-600 font-medium">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Visual DSA Renderer */}
        {visualMode && currentAlgorithm && currentCode && (
          <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-white/20">
            <VisualDSARenderer
              algorithm={currentAlgorithm}
              code={currentCode}
              language={userLanguage}
              stepByStep={true}
              onStepChange={(step) => console.log('Step changed:', step)}
            />
          </div>
        )}

        {/* Enhanced Quiz Modal */}
        {showQuiz && currentQuiz && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
              {/* Header with progress and timer */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-gray-900">🎯 Interactive Quiz</h3>
                  {currentQuiz.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      currentQuiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      currentQuiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentQuiz.difficulty.charAt(0).toUpperCase() + currentQuiz.difficulty.slice(1)}
                    </span>
                  )}
                  {currentQuiz.topic && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {currentQuiz.topic}
                    </span>
                  )}
                </div>
                <button
                  onClick={closeQuiz}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Progress and Score */}
              <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    Score: {quizScore}/{totalQuizzes}
                  </span>
                  <span className="text-sm text-gray-600">
                    Accuracy: {totalQuizzes > 0 ? Math.round((quizScore / totalQuizzes) * 100) : 0}%
                  </span>
                </div>
                {!quizAnswered && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">⏱️</span>
                    <span className={`text-sm font-bold ${
                      timeRemaining <= 10 ? 'text-red-600' : 'text-gray-700'
                    }`}>
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>

              {/* Question */}
              <div className="mb-6">
                <p className="text-gray-700 text-lg leading-relaxed">{currentQuiz.question}</p>
              </div>

              {/* Hints */}
              {currentQuiz.hints && currentQuiz.hints.length > 0 && !quizAnswered && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-yellow-800">💡 Hint {hintIndex + 1}/{currentQuiz.hints.length}</span>
                    {hintIndex < currentQuiz.hints.length - 1 && (
                      <button
                        onClick={showNextHint}
                        className="text-xs text-yellow-600 hover:text-yellow-800 font-semibold"
                      >
                        Next Hint →
                      </button>
                    )}
                  </div>
                  <p className="text-yellow-700 text-sm">{currentQuiz.hints[hintIndex]}</p>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuizAnswer(index)}
                    disabled={quizAnswered || loading}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 font-medium relative overflow-hidden ${
                      quizAnswered
                        ? index === currentQuiz.correct_answer
                          ? 'bg-green-100 border-green-400 text-green-800 shadow-lg'
                          : index === selectedAnswer && index !== currentQuiz.correct_answer
                          ? 'bg-red-100 border-red-400 text-red-800 shadow-lg'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                        : selectedAnswer === index
                        ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-lg'
                        : 'hover:bg-blue-50 border-gray-300 hover:border-blue-400 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {quizAnswered && index === currentQuiz.correct_answer && (
                        <span className="text-green-600 text-xl">✅</span>
                      )}
                      {quizAnswered && index === selectedAnswer && index !== currentQuiz.correct_answer && (
                        <span className="text-red-600 text-xl">❌</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Feedback and Explanation */}
              {quizFeedback && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{quizFeedback}</ReactMarkdown>
                  </div>
                </div>
              )}

              {showExplanation && currentQuiz.explanation && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <h4 className="font-semibold text-purple-800 mb-2">📚 Explanation</h4>
                  <div className="prose prose-sm max-w-none text-purple-700">
                    <ReactMarkdown>{currentQuiz.explanation}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  {quizAnswered && (
                    <button
                      onClick={retryQuiz}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg"
                    >
                      🔄 Retry Question
                    </button>
                  )}
                </div>
                <button
                  onClick={closeQuiz}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  {quizAnswered ? 'Continue Learning' : 'Skip Question'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookmark Manager */}
        {showBookmarkManager && (
          <BookmarkManager onClose={() => setShowBookmarkManager(false)} />
        )}

        {/* Input Form */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-white/20 p-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={sendMessage} className="flex gap-4 mb-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about DSA... (Ctrl+Enter to send)"
                className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending
                  </div>
                ) : (
                  'Send'
                )}
              </button>
            </form>
            
            {/* Topic Selection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-semibold text-gray-700">Topic:</label>
                <select
                  value={currentTopic}
                  onChange={(e) => setCurrentTopic(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
                >
                  <option value="">General DSA</option>
                  <option value="Arrays">📊 Arrays</option>
                  <option value="Strings">📝 Strings</option>
                  <option value="Linked Lists">🔗 Linked Lists</option>
                  <option value="Stacks">📚 Stacks</option>
                  <option value="Queues">🔄 Queues</option>
                  <option value="Trees">🌳 Trees</option>
                  <option value="Graphs">🕸️ Graphs</option>
                  <option value="Dynamic Programming">⚡ Dynamic Programming</option>
                  <option value="Sorting">🔄 Sorting</option>
                  <option value="Searching">🔍 Searching</option>
                </select>
              </div>
              <div className="text-sm text-gray-500 font-medium">
                Press Ctrl+Enter to send
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmotionAwareChat; 
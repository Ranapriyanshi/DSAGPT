import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface LearningAnalytics {
  total_sessions: number;
  total_messages: number;
  average_sentiment: number;
  quiz_accuracy: number;
  topics_covered: string[];
  confusion_topics: string[];
  emotional_trends: Array<{
    timestamp: string;
    sentiment: number;
    emotion: string;
    topic?: string;
  }>;
  session_duration_avg: number;
}

interface TopicPerformance {
  topic: string;
  message_count: number;
  average_sentiment: number;
  quiz_count: number;
  quiz_accuracy: number;
  difficulty_level: string;
}

interface Recommendation {
  type: string;
  message: string;
  topics?: string[];
  priority: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeTrends, setRealTimeTrends] = useState<any[]>([]);
  const [realTimeLoading, setRealTimeLoading] = useState(true);
  const [realTimeError, setRealTimeError] = useState('');
  const [timeWindow, setTimeWindow] = useState(30); // minutes

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Real-time polling for emotional trends
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchRealTimeTrends = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setRealTimeError('No authentication token');
          setRealTimeLoading(false);
          return;
        }
        const response = await fetch(`http://127.0.0.1:8000/analytics/emotional-trends?days=${Math.ceil(timeWindow / 1440)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch real-time trends');
        const data = await response.json();
        setRealTimeTrends(
          (data.trends || []).map((trend: any) => ({
            ...trend,
            time: new Date(trend.timestamp).toLocaleTimeString(),
          }))
        );
        setRealTimeError('');
      } catch (err) {
        setRealTimeError('Failed to load real-time trends');
      } finally {
        setRealTimeLoading(false);
      }
    };
    fetchRealTimeTrends();
    interval = setInterval(fetchRealTimeTrends, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [timeWindow]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch all analytics data in parallel
      const [summaryResponse, topicResponse, recResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/analytics/learning-summary', { headers }),
        fetch('http://127.0.0.1:8000/analytics/topic-performance', { headers }),
        fetch('http://127.0.0.1:8000/analytics/recommendations', { headers })
      ]);

      if (!summaryResponse.ok || !topicResponse.ok || !recResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [summaryData, topicData, recData] = await Promise.all([
        summaryResponse.json(),
        topicResponse.json(),
        recResponse.json()
      ]);

      setAnalytics(summaryData);
      setTopicPerformance(topicData.topics || []);
      setRecommendations(recData.recommendations || []);
      setError('');

    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#10B981'; // green
    if (sentiment < -0.3) return '#EF4444'; // red
    return '#6B7280'; // gray
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-base">Loading your learning analytics...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
                            <div className="text-red-500 text-5xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
                  <p className="text-base text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {refreshing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </div>
            ) : (
              'Try Again'
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
                            <div className="text-gray-400 text-5xl mb-4">📈</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
                  <p className="text-base text-gray-600 mb-6">Start chatting with DSA-GPT to see your learning analytics!</p>
          <button
            onClick={() => window.location.href = '/chat'}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Start Learning
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const emotionalTrendsData = analytics.emotional_trends.map((trend, index) => ({
    time: new Date(trend.timestamp).toLocaleTimeString(),
    sentiment: trend.sentiment,
    emotion: trend.emotion
  }));

  const topicAccuracyData = topicPerformance.map(topic => ({
    name: topic.topic,
    accuracy: topic.quiz_accuracy,
    sentiment: topic.average_sentiment
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Real-Time Emotional Trends Section */}
      <div className="max-w-4xl mx-auto mt-8 mb-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-700">Real-Time Emotional Trends</h2>
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>Last 10 minutes</option>
            <option value={30}>Last 30 minutes</option>
            <option value={60}>Last 1 hour</option>
            <option value={1440}>Last 24 hours</option>
          </select>
        </div>
        {realTimeLoading ? (
          <div className="text-gray-500">Loading real-time trends...</div>
        ) : realTimeError ? (
          <div className="text-red-500">{realTimeError}</div>
        ) : realTimeTrends.length === 0 ? (
          <div className="text-gray-400">No emotional trend data available.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={realTimeTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[-1, 1]} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold">Time: {label}</p>
                          <p>Sentiment: {data.sentiment?.toFixed(3)}</p>
                          <p>Emotion: {data.emotion}</p>
                          {data.topic && <p>Topic: {data.topic}</p>}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sentiment"
                  stroke="#8884d8"
                  dot={false}
                  isAnimationActive={false}
                />
                {realTimeTrends.map((entry, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={() => entry.sentiment}
                    stroke={
                      entry.emotion === 'positive' ? '#10B981' :
                      entry.emotion === 'negative' ? '#EF4444' : '#6B7280'
                    }
                    dot={{
                      stroke: entry.emotion === 'positive' ? '#10B981' : entry.emotion === 'negative' ? '#EF4444' : '#6B7280',
                      strokeWidth: 2,
                      r: 4
                    }}
                    activeDot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Emotion Category Counts</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={['positive', 'neutral', 'negative'].map(cat => ({
                    emotion: cat.charAt(0).toUpperCase() + cat.slice(1),
                    count: realTimeTrends.filter(t => t.emotion === cat).length
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="emotion" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count">
                      <Cell fill="#10B981" />
                      <Cell fill="#6B7280" />
                      <Cell fill="#EF4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Emotion Distribution</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={['positive', 'neutral', 'negative'].map(cat => {
                        const count = realTimeTrends.filter(t => t.emotion === cat).length;
                        const percentage = realTimeTrends.length > 0 ? (count / realTimeTrends.length) * 100 : 0;
                        return {
                          name: cat.charAt(0).toUpperCase() + cat.slice(1),
                          value: count,
                          percentage: percentage.toFixed(1)
                        };
                      }).filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#6B7280" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border border-gray-200 rounded shadow">
                              <p className="font-semibold">{data.name}</p>
                              <p>Count: {data.value}</p>
                              <p>Percentage: {data.percentage}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex gap-4 mt-2 justify-center">
              <span className="flex items-center"><span className="inline-block w-3 h-3 rounded-full mr-1" style={{background:'#10B981'}}></span>Positive</span>
              <span className="flex items-center"><span className="inline-block w-3 h-3 rounded-full mr-1" style={{background:'#6B7280'}}></span>Neutral</span>
              <span className="flex items-center"><span className="inline-block w-3 h-3 rounded-full mr-1" style={{background:'#EF4444'}}></span>Negative</span>
            </div>
          </>
        )}
      </div>
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-20 h-20 bg-green-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-indigo-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Learning Analytics</span>
                </h1>
                <p className="text-sm text-gray-600">Personalized insights and progress tracking</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="font-semibold text-gray-900">{analytics?.total_sessions || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Quiz Accuracy</p>
                  <p className="font-semibold text-gray-900">{analytics?.quiz_accuracy.toFixed(1) || 0}%</p>
                </div>
                <button
                  onClick={fetchAnalytics}
                  disabled={refreshing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center shadow-lg"
                >
                  {refreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Refreshing
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Messages</p>
                  <p className="text-lg font-bold text-blue-600">{analytics?.total_messages || 0}</p>
                </div>
                <div className="text-4xl">💬</div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quiz Accuracy</p>
                  <p className="text-lg font-bold text-green-600">{analytics?.quiz_accuracy.toFixed(1) || 0}%</p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Sentiment</p>
                  <p className="text-lg font-bold text-purple-600">
                    {analytics?.average_sentiment ? (analytics.average_sentiment > 0 ? '+' : '') + analytics.average_sentiment.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="text-4xl">😊</div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Session Duration</p>
                  <p className="text-lg font-bold text-orange-600">{analytics?.session_duration_avg.toFixed(1) || 0}m</p>
                </div>
                <div className="text-4xl">⏱️</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Emotional Trends Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 animate-slideInLeft" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-base font-bold mb-6 flex items-center">
                <span className="mr-3 text-lg">📊</span>
                Emotional Trends
              </h3>
              {emotionalTrendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={emotionalTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="time" stroke="#6B7280" />
                    <YAxis domain={[-1, 1]} stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                                      <div className="text-5xl mb-4">📊</div>
                  <p className="text-base font-semibold mb-2">No emotional data available yet</p>
                  <p className="text-sm text-gray-600">Start chatting to see your emotional trends</p>
                  </div>
                </div>
              )}
            </div>

            {/* Topic Performance Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 animate-slideInRight" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-base font-bold mb-6 flex items-center">
                <span className="mr-3 text-lg">📈</span>
                Topic Performance
              </h3>
              {topicAccuracyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicAccuracyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="accuracy" 
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                                      <div className="text-5xl mb-4">📈</div>
                  <p className="text-base font-semibold mb-2">No topic performance data yet</p>
                  <p className="text-sm text-gray-600">Complete quizzes to see your performance</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 mb-8 animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
              <h3 className="text-base font-bold mb-6 flex items-center">
                <span className="mr-3 text-lg">💡</span>
                Learning Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-xl border-2 ${getPriorityColor(rec.priority)} hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="flex items-start">
                      <span className="text-2xl mr-4">{getPriorityIcon(rec.priority)}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-2">{rec.message}</p>
                        {rec.topics && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {rec.topics.map((topic, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-white bg-opacity-70 rounded-full text-sm font-medium"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics Covered */}
          {analytics?.topics_covered.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 mb-8 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
              <h3 className="text-base font-bold mb-6 flex items-center">
                <span className="mr-3 text-lg">📚</span>
                Topics Covered
              </h3>
              <div className="flex flex-wrap gap-3">
                {analytics.topics_covered.map((topic, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confusion Topics */}
          {analytics?.confusion_topics.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20 animate-fadeInUp" style={{ animationDelay: '0.9s' }}>
              <h3 className="text-base font-bold mb-6 flex items-center">
                <span className="mr-3 text-lg">⚠️</span>
                Topics to Review
              </h3>
              <p className="text-gray-600 mb-4 text-sm">These topics showed signs of confusion - consider reviewing them:</p>
              <div className="flex flex-wrap gap-3">
                {analytics.confusion_topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Icon - Fixed Position */}
      <Link 
        to="/chat" 
        className="fixed top-20 right-4 z-40 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </Link>
    </div>
  );
};

export default AnalyticsDashboard; 
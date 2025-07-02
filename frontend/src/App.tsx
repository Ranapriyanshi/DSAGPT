import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';

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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/users/login', {
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
    <form className="bg-white rounded shadow p-6 max-w-md mx-auto mt-8" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <input className="w-full mb-3 p-2 border rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="w-full mb-3 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">Login</button>
    </form>
  );
}

function Register() {
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
      const res = await fetch('http://127.0.0.1:8000/users/register', {
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
    <form className="bg-white rounded shadow p-6 max-w-md mx-auto mt-8" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Register</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <input className="w-full mb-3 p-2 border rounded" type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
      <input className="w-full mb-3 p-2 border rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="w-full mb-3 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <select className="w-full mb-3 p-2 border rounded" value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)}>
        <option>Python</option>
        <option>C++</option>
        <option>JavaScript</option>
      </select>
      <select className="w-full mb-3 p-2 border rounded" value={dsaLevel} onChange={e => setDsaLevel(e.target.value)}>
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>
      <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">Register</button>
    </form>
  );
}

function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{attempted: number, solved: number, percent: number}>({attempted: 0, solved: 0, percent: 0});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://127.0.0.1:8000/users/me', {
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
    fetch('http://127.0.0.1:8000/questions/progress', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        const attempted = Object.values(data).filter((v: any) => v.attempted).length;
        const solved = Object.values(data).filter((v: any) => v.solved).length;
        // Get total number of questions from backend (for all languages/difficulties)
        fetch('http://127.0.0.1:8000/questions', { headers: { 'Authorization': `Bearer ${token}` } })
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <div className="bg-white rounded shadow p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-bold mb-2">Welcome, {user.name}!</h2>
      <div className="mb-2 text-gray-700">Email: {user.email}</div>
      <div className="mb-2 text-gray-700">Preferred Language: {user.preferred_language}</div>
      <div className="mb-2 text-gray-700">DSA Level: {user.dsa_level}</div>
      <div className="mt-4">
        <div className="font-semibold">Next Recommended Topic:</div>
        <div className="text-blue-700 text-lg">Arrays</div>
      </div>
      <div className="mt-6">
        <div className="font-semibold mb-1">Progress</div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${progress.percent}%` }}></div>
        </div>
        <div className="text-sm text-gray-500 mt-1">{progress.solved} solved / {progress.attempted} attempted / {progress.percent}% completed</div>
      </div>
      <div className="mt-6">
        <div className="font-semibold mb-1">Emotional Trend</div>
        <div className="w-full bg-gray-100 rounded h-16 flex items-center justify-center text-gray-400">(Coming soon)</div>
      </div>
    </div>
  );
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hi! Ask me anything about Data Structures & Algorithms.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('// Try code here!');
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
    const sentimentRes = await fetch('http://127.0.0.1:8000/sentiment', {
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
      const chatRes = await fetch('http://127.0.0.1:8000/gpt-chat', {
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
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded shadow p-4 flex flex-col h-[80vh]">
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
      <div className="mt-6">
        <div className="font-semibold mb-1">Monaco Code Editor</div>
        <MonacoEditor
          height="200px"
          defaultLanguage="python"
          value={code}
          onChange={v => setCode(v || '')}
          options={{ minimap: { enabled: false } }}
        />
      </div>
      <button className="mt-6 bg-green-600 text-white px-4 py-2 rounded self-end" onClick={() => setShowSummary(true)}>
        End Session & Show Summary
      </button>
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

function Questions() {
  const [difficulty, setDifficulty] = useState('basic');
  const [language, setLanguage] = useState('Python');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSolutionId, setShowSolutionId] = useState<number|null>(null);
  const [solution, setSolution] = useState<string>('');
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState('');
  const [answer, setAnswer] = useState<{[id: number]: string}>({});
  const [submitResult, setSubmitResult] = useState<{[id: number]: {correct: boolean, solution?: string}|null}>({});
  const [submitting, setSubmitting] = useState<{[id: number]: boolean}>({});
  const [submitError, setSubmitError] = useState<{[id: number]: string}>({});
  const [progress, setProgress] = useState<{attempted: number[], solved: number[]}>({attempted: [], solved: []});
  const token = localStorage.getItem('token');

  // Fetch progress from backend for logged-in users
  useEffect(() => {
    if (!token) return;
    fetch('http://127.0.0.1:8000/questions/progress', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        // data: { [question_id]: {attempted, solved, last_answer} }
        const attempted = Object.entries(data)
          .filter(([_, v]: any) => v.attempted)
          .map(([k]) => Number(k));
        const solved = Object.entries(data)
          .filter(([_, v]: any) => v.solved)
          .map(([k]) => Number(k));
        setProgress({ attempted, solved });
        // Optionally, preload last answers
        setAnswer(a => ({ ...a, ...Object.fromEntries(Object.entries(data).map(([k, v]: any) => [Number(k), v.last_answer || ''])) }));
      })
      .catch(() => setProgress({ attempted: [], solved: [] }));
  }, [token, difficulty]);

  // Save progress to localStorage for non-logged-in users
  useEffect(() => {
    if (token) return; // skip if logged in
    const key = `dsa_progress_${difficulty}`;
    localStorage.setItem(key, JSON.stringify(progress));
  }, [progress, difficulty, token]);

  // Load progress from localStorage for non-logged-in users
  useEffect(() => {
    if (token) return; // skip if logged in
    const key = `dsa_progress_${difficulty}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setProgress(JSON.parse(stored));
    } else {
      setProgress({attempted: [], solved: []});
    }
  }, [difficulty, token]);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`http://127.0.0.1:8000/questions?difficulty=${difficulty}&language=${encodeURIComponent(language)}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => { setQuestions(data); setLoading(false); })
      .catch(() => { setError('Failed to load questions'); setLoading(false); });
  }, [difficulty, language]);

  const handleShowSolution = (id: number) => {
    setShowSolutionId(id);
    setSolution('');
    setSolutionError('');
    setSolutionLoading(true);
    fetch(`http://127.0.0.1:8000/questions/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setSolution(data.solution || 'No solution available.');
        setSolutionLoading(false);
      })
      .catch(() => {
        setSolutionError('Failed to load solution');
        setSolutionLoading(false);
      });
  };

  const closeModal = () => {
    setShowSolutionId(null);
    setSolution('');
    setSolutionError('');
    setSubmitResult(r => ({...r, [showSolutionId as number]: null}));
    setSubmitError(e => ({...e, [showSolutionId as number]: ''}));
  };

  const handleAnswerChange = (id: number, value: string) => {
    setAnswer(a => ({...a, [id]: value}));
  };

  const handleSubmitAnswer = async (id: number) => {
    setSubmitting(s => ({...s, [id]: true}));
    setSubmitError(e => ({...e, [id]: ''}));
    setSubmitResult(r => ({...r, [id]: null}));
    try {
      const res = await fetch(`http://127.0.0.1:8000/questions/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answer[id] || '' })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitResult(r => ({...r, [id]: data}));
        // Update progress in backend if logged in
        if (token) {
          await fetch(`http://127.0.0.1:8000/questions/${id}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              attempted: true,
              solved: data.correct,
              last_answer: answer[id] || ''
            })
          });
          // Refetch progress from backend
          fetch('http://127.0.0.1:8000/questions/progress', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
              const attempted = Object.entries(data)
                .filter(([_, v]: any) => v.attempted)
                .map(([k]) => Number(k));
              const solved = Object.entries(data)
                .filter(([_, v]: any) => v.solved)
                .map(([k]) => Number(k));
              setProgress({ attempted, solved });
            });
        }
        setProgress(prev => {
          const attempted = prev.attempted.includes(id) ? prev.attempted : [...prev.attempted, id];
          const solved = data.correct ? (prev.solved.includes(id) ? prev.solved : [...prev.solved, id]) : prev.solved.filter(qid => qid !== id);
          return { attempted, solved };
        });
      } else {
        setSubmitError(e => ({...e, [id]: data.detail || 'Submission failed'}));
      }
    } catch {
      setSubmitError(e => ({...e, [id]: 'Network error'}));
    }
    setSubmitting(s => ({...s, [id]: false}));
  };

  const questionIds = questions.map(q => q.id);
  const attempted = progress.attempted.filter(id => questionIds.includes(id)).length;
  const solved = progress.solved.filter(id => questionIds.includes(id)).length;
  const total = questions.length;
  const percent = total ? Math.round((solved / total) * 100) : 0;

  return (
    <div className="bg-white rounded shadow p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">DSA Questions</h2>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
        <div>
          <label className="mr-2 font-semibold">Select Difficulty:</label>
          <select className="border rounded p-2" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-semibold">Language:</label>
          <select className="border rounded p-2" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="Python">Python</option>
            <option value="C++">C++</option>
            <option value="JavaScript">JavaScript</option>
          </select>
        </div>
      </div>
      <div className="mb-6">
        <div className="mb-1 font-semibold">Progress: {solved} solved / {attempted} attempted / {total} total</div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-green-600 h-4 rounded-full" style={{ width: `${percent}%` }}></div>
        </div>
        <div className="text-sm text-gray-500 mt-1">{percent}% solved</div>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id || i} className="border rounded p-4">
            <div className="font-semibold text-lg mb-2">{q.title}</div>
            <div className="text-gray-700 mb-2">{q.description}</div>
            <div className="text-xs text-gray-500 mb-2">Difficulty: {q.difficulty}</div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <input
                className="border rounded p-2 flex-1"
                placeholder="Your answer (short description or approach)"
                value={answer[q.id] || ''}
                onChange={e => handleAnswerChange(q.id, e.target.value)}
                disabled={submitting[q.id]}
              />
              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => handleSubmitAnswer(q.id)}
                disabled={submitting[q.id] || !(answer[q.id] && answer[q.id].trim())}
              >
                {submitting[q.id] ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
            {submitError[q.id] && <div className="text-red-600 mb-2">{submitError[q.id]}</div>}
            {submitResult[q.id] && (
              <div className={`mb-2 font-semibold ${submitResult[q.id]?.correct ? 'text-green-600' : 'text-red-600'}`}>
                {submitResult[q.id]?.correct ? 'Correct!' : 'Incorrect.'}
                {!submitResult[q.id]?.correct && submitResult[q.id]?.solution && (
                  <>
                    <br />Solution: <span className="font-normal text-gray-700">{submitResult[q.id]?.solution}</span>
                  </>
                )}
              </div>
            )}
            <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleShowSolution(q.id)}>Show Solution</button>
          </li>
        ))}
      </ul>
      {showSolutionId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl" onClick={closeModal}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Solution</h3>
            {solutionLoading && <div>Loading...</div>}
            {solutionError && <div className="text-red-600">{solutionError}</div>}
            {!solutionLoading && !solutionError && <div className="text-gray-800 whitespace-pre-line">{solution}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const isLoggedIn = !!localStorage.getItem('token');
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-600 text-white px-4 py-3 shadow flex items-center justify-between">
          <div className="text-2xl font-bold">
            <Link to="/">DSA-GPT</Link>
          </div>
          <div className="space-x-4">
            {isLoggedIn && <Link to="/questions" className="hover:underline">Questions</Link>}
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                <Link to="/chat" className="hover:underline">Chat</Link>
                <button className="ml-4 underline" onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Register</Link>
              </>
            )}
          </div>
        </nav>
        <main className="max-w-3xl mx-auto py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/chat" element={isLoggedIn ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/questions" element={isLoggedIn ? <Questions /> : <Navigate to="/login" />} />
            <Route path="/" element={<div className="bg-white rounded shadow p-6 mt-6"><h1 className="text-xl font-semibold mb-2">Welcome to DSA-GPT</h1><p className="text-gray-700">AI-powered tutoring for Data Structures & Algorithms.</p></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

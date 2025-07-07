import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiUrl } from '../api';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sentiment?: number;
  emotion_category?: string;
  timestamp: Date;
}

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

const ChatFab: React.FC = () => {
  const [showPopover, setShowPopover] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hi! I'm DSA-GPT, your emotion-aware AI tutor. I'll adapt my teaching style based on how you're feeling. What would you like to learn about today?",
      sentiment: 0,
      emotion_category: 'neutral',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Auto-close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: Message = { sender: 'user', text: input, timestamp: new Date() };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('chat/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: userMsg.text, topic: 'DSA' })
      });
      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      setMessages(msgs => [...msgs, {
        sender: 'bot',
        text: data.response,
        sentiment: data.sentiment_score,
        emotion_category: data.emotion_category,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { sender: 'bot', text: 'Sorry, something went wrong.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {showPopover && !open && (
        <div className="mb-3 max-w-xs px-4 py-3 rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm animate-fadeIn">
          Hey, Feeling stuck? Just let me know — I adjust explanations based on how you're doing.
        </div>
      )}
      <button
        className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none"
        aria-label="Open Chat"
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        onFocus={() => setShowPopover(true)}
        onBlur={() => setShowPopover(false)}
        onClick={() => setOpen(true)}
        tabIndex={0}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
      {open && (
        <>
          {/* Light greyish overlay */}
          <div className="fixed inset-0 z-40 bg-gray-200 bg-opacity-40 transition-opacity" />
          <div
            ref={modalRef}
            className="fixed bottom-24 right-8 z-50 w-[90vw] max-w-sm sm:max-w-md h-[70vh] flex flex-col shadow-2xl rounded-2xl bg-gradient-to-br from-blue-700 via-purple-600 to-blue-500 border border-gray-200 animate-fadeInUp text-white"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/20 bg-gradient-to-r from-blue-800 to-purple-700 rounded-t-2xl">
              <span className="font-bold text-white tracking-wide">DSA-GPT Chat</span>
              <button
                className="text-2xl font-bold text-white hover:text-blue-200 focus:outline-none"
                onClick={() => setOpen(false)}
                aria-label="Close Chat"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl shadow text-sm backdrop-blur-md bg-white/60 ${msg.sender === 'user' ? 'text-right text-blue-900' : 'text-left text-purple-900'}`} style={{border: '1px solid rgba(255,255,255,0.3)'}}>
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender === 'bot' && msg.emotion_category && (
                        <>
                          <span className="text-lg">{getEmotionIcon(msg.emotion_category)}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 border border-blue-200">{msg.emotion_category}</span>
                        </>
                      )}
                      {msg.sender === 'user' && <span className="text-lg">👤</span>}
                    </div>
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="text-blue-900 prose prose-sm max-w-none" {...props} />,
                        code: ({node, ...props}) => <code className="bg-blue-100 text-blue-800 px-1 rounded" {...props} />,
                        a: ({node, ...props}) => <a className="underline text-blue-700 hover:text-blue-900" {...props} />,
                        li: ({node, ...props}) => <li className="text-blue-900" {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                    <div className="text-[10px] text-blue-900/60 mt-1">{msg.timestamp.toLocaleTimeString()}</div>
                    {msg.sentiment !== undefined && (
                      <div className="text-[10px] text-blue-900/50">Sentiment: {msg.sentiment > 0 ? '+' : ''}{msg.sentiment?.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="flex gap-2 p-3 border-t border-white/20 bg-gradient-to-r from-blue-800 to-purple-700 rounded-b-2xl" onSubmit={sendMessage}>
              <input
                className="flex-1 border border-white/30 rounded p-2 text-sm bg-white/20 text-white placeholder-white/80 focus:bg-white/40 focus:outline-none caret-white"
                placeholder="Type your question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button className="bg-white text-blue-700 font-bold px-4 py-2 rounded text-sm shadow hover:bg-blue-100 transition border border-blue-200" type="submit" disabled={loading}>
                {loading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatFab; 
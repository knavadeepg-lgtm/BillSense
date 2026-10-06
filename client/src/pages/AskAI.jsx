import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquareText, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  FileCheck, 
  Loader2
} from 'lucide-react';
import api from '../services/api';

export default function AskAI() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your BillSense AI Document Assistant. Ask me anything about your uploaded bills, receipts, or vendor payments (e.g. 'How much did I spend on electricity this quarter?'). I will answer strictly based on your saved document records.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sampleQuestions = [
    'How much did I spend on electricity and utilities?',
    'What is my overall total spending across all invoices?',
    'Who is my highest vendor by total payout?',
    'How much money was spent on inventory and raw materials?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (qText) => {
    const textToSend = qText || question;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!qText) setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/chat/ask', { question: textToSend });
      if (res.data.success) {
        const aiMsg = {
          sender: 'ai',
          text: res.data.answer,
          sourcesCount: res.data.sourcesCount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        sender: 'ai',
        text: 'Sorry, I encountered an error searching your document records. Please try again.',
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquareText className="w-7 h-7 text-indigo-600" />
          <span>Ask Your Documents AI</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Instant natural-language answers grounded strictly in your extracted invoice database.
        </p>
      </div>

      {/* Suggested Quick Question Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Suggested:
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-indigo-600 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* CHAT MESSAGES DISPLAY BOX */}
      <div className="flex-1 ui-card rounded-2xl p-6 overflow-y-auto space-y-4 bg-white border border-slate-200">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : msg.isError
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble Box */}
            <div
              className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 rounded-tr-none font-medium'
                  : 'bg-slate-50 text-slate-900 border border-slate-200/90 rounded-tl-none font-medium'
              }`}
            >
              <p>{msg.text}</p>

              <div
                className={`flex items-center justify-between text-[11px] pt-1 border-t ${
                  msg.sender === 'user' ? 'border-indigo-500/40 text-indigo-100' : 'border-slate-200 text-slate-400 font-semibold'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.sourcesCount !== undefined && (
                  <span className="flex items-center gap-1 font-bold text-indigo-600">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Grounded in {msg.sourcesCount} doc(s)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 flex-row">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-sm text-slate-600 font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Searching extracted document data with Gemini AI...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your bills (e.g. How much spent on rent in 2026?)..."
          className="w-full pl-5 pr-14 py-4 rounded-2xl ui-input text-sm shadow-md"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

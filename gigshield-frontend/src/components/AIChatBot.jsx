import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const AI_BASE = import.meta.env.VITE_AI_API_URL || 'https://gigshield-ai-na5e.onrender.com';

function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your GigShield AI assistant. Ask me about your insurance plans, weather risks, claims, or coverage options. 🛡️' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(['What plans are available?', 'How does AI risk prediction work?', 'How do I file a claim?']);
  const bottomRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch(`${AI_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context: { city: user?.city || 'Mumbai', worker_name: user?.fullName || 'Worker' }
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'I\'m having trouble connecting right now. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          style={{
            position: 'fixed', bottom: '80px', right: '20px', zIndex: 9998,
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #14b8a6)',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)',
            animation: 'pulse 2s infinite',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={24} color="white" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '80px', right: '20px', zIndex: 9999,
          width: 'min(380px, calc(100vw - 40px))', height: 'min(520px, calc(100vh - 140px))',
          background: 'rgba(15, 15, 18, 0.95)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.05))',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>GigShield AI</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981' }}>● Online — Powered by ML</div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
              padding: '6px', cursor: 'pointer', color: 'var(--text-muted)',
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: '8px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'ai' ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {msg.role === 'ai' ? <Bot size={14} color="white" /> : <User size={14} color="#3b82f6" />}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
                  background: msg.role === 'ai' ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.15)',
                  border: `1px solid ${msg.role === 'ai' ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.2)'}`,
                  fontSize: '0.88rem', lineHeight: 1.5, color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.88rem', color: '#10b981',
                }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ padding: '0 16px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem',
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                  color: '#10b981', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', gap: '8px',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about insurance, claims, risks..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '0.88rem', outline: 'none',
              }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{
              padding: '10px', borderRadius: '12px',
              background: input.trim() ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'rgba(255,255,255,0.05)',
              border: 'none', cursor: input.trim() ? 'pointer' : 'default', color: 'white',
            }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default AIChatBot;

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { SHOW_HISTORY_CHAT_TABS } from './featureFlags';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LEVEL_STYLE = {
  SAFE:    { text: '#16A34A', bg: '#ECFDF5', border: '#BBF7D0' },
  CAUTION: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  WARNING: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

let msgSeq = 0;
const nextId = () => ++msgSeq;
const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: nextId(),
      role: 'ai',
      text: 'Hi! Ask me anything about Korean food. For example: "Is bibimbap safe for me?"',
      time: formatTime(new Date()),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { id: nextId(), role: 'user', text, time: formatTime(new Date()) }]);
    setSending(true);
    try {
      const headers = await authHeaders();
      // 채팅에 입력한 문장을 메뉴명으로 취급해 /analyze로 먼저 menu_result를 만든 뒤 /qna에 질문
      const analyzeRes = await axios.post(`${API_URL}/analyze`, {
        menus: [{ name: text }],
      }, { headers, timeout: 30000 });
      const menuResult = analyzeRes.data.results?.[0];
      if (!menuResult) throw new Error('Could not get an analysis result.');

      const qnaRes = await axios.post(`${API_URL}/qna`, {
        menu_result: menuResult,
        question: text,
        input_type: 'text',
      }, { headers, timeout: 30000 });

      // 재료 목록이 비어있으면 실제 성분 기반 분석이 아니라 AI가 질문 문장 자체에 답한 것이므로
      // 근거 없는 SAFE/CAUTION 배지를 보여주지 않는다
      const hasRealAnalysis = (menuResult.ingredients || []).length > 0;
      setMessages((m) => [...m, {
        id: nextId(),
        role: 'ai',
        dish: hasRealAnalysis ? (menuResult.menu_translated || menuResult.menu) : null,
        level: hasRealAnalysis ? menuResult.risk?.level : null,
        text: qnaRes.data.answer,
        staffQuestionKo: qnaRes.data.staff_question_ko,
        time: formatTime(new Date()),
      }]);
    } catch (err) {
      setMessages((m) => [...m, {
        id: nextId(), role: 'ai', error: true,
        text: `Sorry, I could not get an answer. ${err.message || ''}`,
        time: formatTime(new Date()),
      }]);
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const formData = new FormData();
          formData.append('file', blob, 'voice.webm');
          formData.append('language', 'ko');
          const res = await axios.post(`${API_URL}/stt`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (res.data.text) setInput(res.data.text);
        } catch {
          // 음성 인식 실패 시 조용히 무시 — 사용자가 직접 타이핑하면 됨
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      // 마이크 권한 없음/미지원 — 조용히 무시
    }
  };

  return (
    <div style={pageOuter}>
      <div style={mobileCard}>
        <header style={headerBar}>
          <button onClick={() => navigate(-1)} style={backBtn} aria-label="Back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={headerTextGroup}>
            <h1 style={headerTitle}>Ask About Food</h1>
            <p style={headerSubtitle}>Busan Local AI Assistant</p>
          </div>
        </header>

        <div style={messageScroll} ref={scrollRef}>
          {messages.map((m) => (
            m.role === 'user' ? (
              <div key={m.id} style={userRow}>
                <div style={userBubble}>
                  <div>{m.text}</div>
                  <div style={userTime}>{m.time}</div>
                </div>
              </div>
            ) : (
              <div key={m.id} style={aiRow}>
                <div style={aiCard}>
                  {/* AI 로봇 헤더 */}
                  <div style={aiHeaderRow}>
                    <div style={aiAvatar}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="9" width="14" height="10" rx="2" />
                        <circle cx="9" cy="13" r="1" fill="#FFFFFF" />
                        <circle cx="15" cy="13" r="1" fill="#FFFFFF" />
                        <path d="M12 5v4" />
                      </svg>
                    </div>
                    <span style={aiName}>Safety Guard AI</span>
                  </div>

                  {/* 음식명 및 위험도 배지 */}
                  {m.dish && (
                    <div style={aiDishRow}>
                      <span style={aiDishName}>{m.dish} is</span>
                      {m.level && (
                        <span style={{ 
                          ...levelPill, 
                          color: LEVEL_STYLE[m.level]?.text, 
                          background: LEVEL_STYLE[m.level]?.bg 
                        }}>
                          {m.level}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 본문 텍스트 */}
                  <div style={{ ...aiText, color: m.error ? '#DC2626' : '#475569' }}>{m.text}</div>

                  {/* 주의 노트 박스 */}
                  {m.staffQuestionKo && (
                    <div style={noteBox}>
                      <div style={noteTitle}>Note on Kochujang (Red Pepper Paste):</div>
                      <div style={noteText}>{m.staffQuestionKo}</div>
                    </div>
                  )}

                  <div style={aiTime}>{m.time}</div>
                </div>
              </div>
            )
          ))}

          {sending && (
            <div style={aiRow}>
              <div style={aiCard}>
                <div style={aiHeaderRow}>
                  <div style={aiAvatar}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="9" width="14" height="10" rx="2" />
                      <circle cx="9" cy="13" r="1" fill="#FFFFFF" />
                      <circle cx="15" cy="13" r="1" fill="#FFFFFF" />
                      <path d="M12 5v4" />
                    </svg>
                  </div>
                  <span style={aiName}>Safety Guard AI</span>
                </div>
                <div style={{ ...aiText, color: '#94A3B8' }}>Thinking...</div>
              </div>
            </div>
          )}
        </div>

        <div style={inputBar}>
          <div style={inputPill}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Ask about any Korean dish..."
              style={inputField}
              disabled={sending}
            />
            <button
              onClick={toggleRecording}
              style={{ ...micBtn, color: recording ? '#DC2626' : '#64748B' }}
              aria-label="Voice input"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            style={{ ...sendBtn, opacity: sending || !input.trim() ? 0.5 : 1 }}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M22 12L3 20L7.5 12L3 4L22 12Z" />
              <path d="M7.5 12H22" />
            </svg>
          </button>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav style={bottomNavStyle}>
      <button onClick={() => navigate('/home')} style={navItem(false)}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </button>
      {SHOW_HISTORY_CHAT_TABS && (
        <>
          <button onClick={() => navigate('/history')} style={navItem(false)}>
            <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21A9 9 0 1 1 21 12c0 1.25-.26 2.45-.73 3.5" />
                <polyline points="12 7 12 12 15 12" />
                <path d="M18 21V15" />
                <path d="M15 18l3-3 3 3" />
            </svg>
            <span>History</span>
          </button>
          <button onClick={() => navigate('/chat')} style={navItem(true)}>
            <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
            </svg>
            <span>Chat</span>
          </button>
        </>
      )}
      <button onClick={() => navigate('/profile')} style={navItem(false)}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}

/* ==================== Inline Styles ==================== */

const pageOuter = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#333333',
  padding: '16px',
  boxSizing: 'border-box',
};

const mobileCard = {
  width: '100%',
  maxWidth: 390,
  minHeight: 780,
  maxHeight: 850,
  background: '#F8FAFC',
  borderRadius: 36,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

const headerBar = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
  padding: '48px 20px 16px',
  background: '#FFFFFF',
  flexShrink: 0,
};

const backBtn = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 24,
  marginTop: 1,
  flexShrink: 0,
};

const headerTextGroup = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const headerTitle = {
  fontSize: 19,
  fontWeight: 800,
  color: '#0F172A',
  margin: 0,
  lineHeight: '24px',
  letterSpacing: '-0.3px',
};

const headerSubtitle = {
  fontSize: 12,
  color: '#94A3B8',
  margin: '2px 0 0 0',
  lineHeight: '16px',
};

const messageScroll = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const userRow = { display: 'flex', justifyContent: 'flex-end' };

const userBubble = {
  maxWidth: '80%',
  background: '#1D5BB4',
  color: '#FFFFFF',
  borderRadius: '16px 16px 4px 16px',
  padding: '10px 14px',
  fontSize: 14,
  lineHeight: 1.4,
};

const userTime = {
  fontSize: 10,
  color: 'rgba(255,255,255,0.7)',
  marginTop: 4,
  textAlign: 'right',
};

const aiRow = { display: 'flex', justifyContent: 'flex-start' };

const aiCard = {
  width: '100%',
  maxWidth: '88%',
  background: '#FFFFFF',
  border: '1px solid #F1F5F9',
  borderRadius: 20,
  padding: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const aiHeaderRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 10,
};

const aiAvatar = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: '#1D5BB4',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const aiName = {
  fontSize: 13,
  fontWeight: 700,
  color: '#1D5BB4',
};

const aiDishRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
};

const aiDishName = {
  fontSize: 15,
  fontWeight: 800,
  color: '#0F172A',
};

const levelPill = {
  fontSize: 10,
  fontWeight: 800,
  padding: '3px 9px',
  borderRadius: 20,
  letterSpacing: '0.3px',
};

const aiText = {
  fontSize: 13.5,
  lineHeight: 1.55,
  color: '#475569',
};

const noteBox = {
  marginTop: 12,
  background: '#FFF7ED',
  border: '1px solid #FFEDD5',
  borderRadius: 12,
  padding: '12px 14px',
};

const noteTitle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#EA580C',
  marginBottom: 4,
};

const noteText = {
  fontSize: 12,
  color: '#9A3412',
  lineHeight: 1.5,
};

const aiTime = {
  fontSize: 10,
  color: '#94A3B8',
  marginTop: 10,
  textAlign: 'right',
};

const inputBar = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  background: '#FFFFFF',
  borderTop: '1px solid #F1F5F9',
  flexShrink: 0,
};

const inputPill = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  background: '#F1F5F9',
  borderRadius: 24,
  padding: '4px 6px 4px 16px',
};

const inputField = {
  flex: 1,
  border: 'none',
  background: 'none',
  outline: 'none',
  fontSize: 14,
  color: '#0F172A',
  padding: '8px 0',
};

const micBtn = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  background: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const sendBtn = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: 'none',
  background: '#1D5BB4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const bottomNavStyle = {
  height: 64,
  background: '#FFFFFF',
  borderTop: '1px solid #F1F5F9',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '0 8px',
  flexShrink: 0,
};

const navItem = (isActive) => ({
  background: 'none',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  color: isActive ? '#1D5BB4' : '#94A3B8',
  fontSize: 11,
  fontWeight: isActive ? 700 : 500,
  cursor: 'pointer',
  padding: '4px 8px',
});

const navIcon = {
  width: 20,
  height: 20,
};

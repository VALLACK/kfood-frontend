import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { SHOW_HISTORY_CHAT_TABS } from './featureFlags';
import LoginRequiredModal from './components/LoginRequiredModal';
import ResultCard from './components/ResultCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LEVEL_ORDER = { SAFE: 0, CAUTION: 1, WARNING: 2 };

const LEVEL_STYLE = {
  SAFE:    { text: '#16A34A', bg: '#ECFDF5', border: '#BBF7D0' },
  CAUTION: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  WARNING: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

export default function ResultPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [results, setResults]   = useState(() => location.state?.analysisSnapshot?.results || []);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [profileApplied, setProfileApplied] = useState(() => location.state?.analysisSnapshot?.profileApplied ?? true);
  const analysisStarted = useRef(false);

  const menus = location.state?.menus;
  const ocrText = location.state?.ocrText;
  const truncated = location.state?.truncated === true;

  useEffect(() => {
    // React StrictMode must not submit the same analysis twice on mount.
    if (analysisStarted.current) return;
    analysisStarted.current = true;
    if (location.state?.analysisSnapshot) return;
    // 메뉴 확인 화면에서 확정한 목록을 우선 사용한다.
    // ocr_text를 그대로 보내 서버가 줄 단위로 재파싱(가격까지 메뉴명에 섞임)하는 것보다 정확함
    if (menus && menus.length > 0) {
      fetchAnalysis({ menus });
    } else if (!location.state?.menusReviewed && ocrText) {
      fetchAnalysis({ ocr_text: ocrText });
    }
  }, []);

  const fetchAnalysis = async (payload) => {
    setLoading(true);
    setError('');
    try {
      // 로그인 상태면 Supabase 토큰을 실어 보내서 서버가 DB에 저장된 프로필(알레르기 등)을 적용하게 함
      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      
      const isGuest = localStorage.getItem('isGuest') === 'true';
      const guest = JSON.parse(
        localStorage.getItem('guestProfile') || 'null'
      );

       const body = {
      ...payload,

      ...(isGuest && guest
        ? {
            profile: {
              allergies: guest.allergies || [],
              religious_diet: guest.religious_diet || null,
              vegetarian_type: guest.vegetarian_type || null,
              preferred_language:
                localStorage.getItem('appLanguage') || 'en',
            },
          }
        : {}),
      };

    const res = await axios.post(`${API_URL}/analyze`, body, {
      timeout: 180000,
      headers,
    });

      setResults(res.data.results || []);
      setProfileApplied(res.data.profile_applied !== false);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('Cannot reach the server. Please check that it is running.');
      } else if (err.code === 'ECONNABORTED') {
        setError('The analysis is taking too long. Please try again in a moment.');
      } else if (err.response?.status === 500) {
        setError('A server error occurred. Please try again later.');
      } else if (err.response?.status === 429) {
        setError('AI request limit reached. Please try again shortly.');
      } else {
        setError(`Something went wrong: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 같은 이름의 메뉴가 두 번 나올 수 있어(예: 소/대) 이름이 아니라 원래 순번(idx)으로 갱신한다
  const sorted = results
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => (LEVEL_ORDER[b.item.risk?.level] ?? 0) - (LEVEL_ORDER[a.item.risk?.level] ?? 0));
  const handleUpdated = (idx, updated) => setResults((prev) => prev.map((r, i) => (i === idx ? updated : r)));
  const summary = {
    WARNING: results.filter((r) => r.risk?.level === 'WARNING').length,
    CAUTION: results.filter((r) => r.risk?.level === 'CAUTION').length,
    SAFE:    results.filter((r) => r.risk?.level === 'SAFE').length,
  };

  return (
    <div style={pageOuter}>
      <div style={mobileCard}>
        <header style={headerBar}>
          <button onClick={() => navigate(-1)} style={backBtn} aria-label="Back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0F172A" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <div style={headerTitle}>Analysis Results</div>
            {results.length > 0 && (
              <div style={headerSubtitle}>{results.length} menu {results.length === 1 ? 'item' : 'items'} detected</div>
            )}
          </div>
        </header>

        <div style={contentScroll}>
          <button type="button" className="dietary-card-entry" style={{ marginBottom: 16 }} onClick={() => navigate('/profile/card', { state: { cardBackground: { ...location, state: { ...location.state, ...(results.length > 0 ? { analysisSnapshot: { results, profileApplied } } : {}) } } } })}>Show my dietary card</button>
          {truncated && (
            <div style={noticeBox} role="status">
              ⚠️ Only some menu items were recognized. These results may be incomplete. Please photograph the remaining items separately.
            </div>
          )}

          {results.length > 0 && (
            <div style={summaryRow}>
              {(['SAFE', 'CAUTION', 'WARNING']).map((level) => {
                const s = LEVEL_STYLE[level];
                return (
                  <div key={level} style={{ ...summaryChip, background: s.bg, border: `1px solid ${s.border}` }}>
                    <span style={{ ...summaryDot, background: s.text }} />
                    <span style={{ fontWeight: 800, color: s.text }}>{summary[level]}</span>
                    <span style={{ color: s.text, fontWeight: 600 }}>{level}</span>
                  </div>
                );
              })}
            </div>
          )}

          {loading && <div style={loadingBox}>🧠 Analyzing ingredients...</div>}
          {error   && <div style={errorBox}>⚠️ {error}</div>}
          {!profileApplied && results.length > 0 && (
            <div style={noticeBox}>
              ⚠️ Your profile was not applied. Log in and set your allergies and diet to get personalized results. Until then, SAFE does not mean the dish is safe for you.
            </div>
          )}

          {sorted.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map(({ item, idx }) => (
                <ResultCard key={idx} item={item} onUpdated={(updated) => handleUpdated(idx, updated)} />
              ))}
            </div>
          ) : (
            !loading && (
              <div style={emptyBox}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: '#0F172A' }}>No results</div>
                <div style={{ fontSize: 13, color: '#94A3B8' }}>Go back to the scan page and scan a menu.</div>
              </div>
            )
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}


function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('History');

  const handleProtectedNav = (targetPath, featureName) => {
    const isGuest = localStorage.getItem('isGuest') === 'true';

    if (isGuest) {
      setSelectedFeature(featureName);
      setShowLoginModal(true);
      return;
    }

    navigate(targetPath);
  };

  return (
    <>
      <nav style={bottomNavStyle}>
        {/* Home */}
        <button onClick={() => navigate('/home')} aria-current={pathname === '/home' ? 'page' : undefined} style={navItem(pathname === '/home')}>
          <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6a1.5 1.5 0 0 0-1.5-1.5h-3a1.5 1.5 0 0 0-1.5 1.5v6H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
          </svg>
          <span>Home</span>
        </button>

        {SHOW_HISTORY_CHAT_TABS && (
          <>
            {/* History */}
            <button
              onClick={() => handleProtectedNav('/history', 'History')}
              aria-current={pathname === '/history' ? 'page' : undefined}
              style={navItem(pathname === '/history')}
            >
              <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21A9 9 0 1 1 21 12c0 1.25-.26 2.45-.73 3.5" />
                <polyline points="12 7 12 12 15 12" />
                <path d="M18 21V15" />
                <path d="M15 18l3-3 3 3" />
              </svg>
              <span>History</span>
            </button>

            {/* Chat */}
            <button
              onClick={() => handleProtectedNav('/chat', 'Chat')}
              aria-current={pathname === '/chat' ? 'page' : undefined}
              style={navItem(pathname === '/chat')}
            >
              <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
              </svg>
              <span>Chat</span>
            </button>
          </>
        )}

        {/* Profile */}
        <button onClick={() => navigate('/profile')} aria-current={pathname === '/profile' ? 'page' : undefined} style={navItem(pathname === '/profile')}>
          <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </button>
      </nav>

      <LoginRequiredModal
        isOpen={showLoginModal}
        selectedFeature={selectedFeature}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => navigate('/')}
      />
    </>
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
  alignItems: 'center',
  gap: 14,
  padding: '48px 20px 16px',
  background: '#FFFFFF',
  borderBottom: '1px solid #F1F5F9',
};

const backBtn = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  background: '#F1F5F9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const headerTitle = {
  fontSize: 19,
  fontWeight: 800,
  color: '#0F172A',
  letterSpacing: '-0.3px',
};

const headerSubtitle = {
  fontSize: 12,
  color: '#94A3B8',
  marginTop: 2,
};

const contentScroll = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 20px 20px',
};

const summaryRow = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
};

const summaryChip = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  borderRadius: 20,
  padding: '8px 6px',
  fontSize: 12,
};

const summaryDot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  display: 'inline-block',
};

const loadingBox = { textAlign: 'center', padding: '40px 20px', fontSize: 14, color: '#64748B' };
const staffHintBtn = { display: 'block', width: 'calc(100% - 32px)', margin: '0 16px 14px', textAlign: 'left', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '9px 12px', fontSize: 12, fontWeight: 700, color: '#92400E', cursor: 'pointer' };
const noticeBox = { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400E', marginBottom: 14, lineHeight: 1.5 };
const errorBox = { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#DC2626', marginBottom: 14, lineHeight: 1.5 };
const emptyBox = { textAlign: 'center', padding: '60px 20px' };

const cardBase = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #F1F5F9',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const cardHeaderBtn = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

const cardMenuName = {
  fontSize: 16,
  fontWeight: 800,
  color: '#0F172A',
};

const cardMenuTranslated = {
  fontSize: 12,
  color: '#64748B',
  marginTop: 2,
};

const levelPill = {
  fontSize: 11,
  fontWeight: 800,
  padding: '4px 10px',
  borderRadius: 20,
  letterSpacing: '0.3px',
};

const cardBody = {
  padding: '0 16px 16px',
};

const alertBox = {
  borderRadius: 12,
  padding: '12px 14px',
  marginBottom: 4,
};

const alertTitle = {
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 4,
  display: 'flex',
  alignItems: 'center',
};

const alertDesc = {
  fontSize: 13,
  color: '#334155',
  lineHeight: 1.5,
};

const breakdownLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.5px',
  color: '#94A3B8',
  marginBottom: 6,
};

const breakdownText = {
  fontSize: 13,
  color: '#334155',
  lineHeight: 1.6,
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
  width: 22,
  height: 22,
};

const ratioList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const ratioItem = {
  width: '100%',
};

const ratioHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 12,
  color: '#334155',
  marginBottom: 4,
};

const ratioBar = {
  width: '100%',
  height: 7,
  background: '#E2E8F0',
  borderRadius: 10,
  overflow: 'hidden',
};

const ratioBarFill = {
  height: '100%',
  background: '#64748B',
  borderRadius: 10,
};

const reasoningBox = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: '1px solid #F1F5F9',
};

const reasoningText = {
  fontSize: 12,
  color: '#64748B',
  lineHeight: 1.5,
};
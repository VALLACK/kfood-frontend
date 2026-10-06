import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LEVEL_ORDER = { SAFE: 0, CAUTION: 1, WARNING: 2 };

const LEVEL_STYLE = {
  SAFE:    { text: '#16A34A', bg: '#ECFDF5', border: '#BBF7D0' },
  CAUTION: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  WARNING: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

// 로그인 토큰을 헤더에 실어 보낸다 (없으면 비로그인 분석)
async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}


/* ── 메뉴 카드 ── */
function ResultCard({ item }) {
  const risk = item.risk || {};
  const level = risk.level || 'SAFE';
  const style = LEVEL_STYLE[level];
  const [open, setOpen] = useState(level === 'WARNING');

  const confirmed = risk.confirmed_reasons || [];
  const possible = risk.possible_reasons || [];
  const ingredients = item.ingredients || [];

  const withRatio = ingredients.filter((i) => typeof i.ratio_percent === 'number');
  const isRealRatio = ingredients.some((i) => i.ratio_source === 'menuzen');
  const displayName = item.menu_translated || item.menu;

  return (
    <div style={{ ...cardBase, ...(level === 'WARNING' ? { border: `2px solid ${style.border}` } : {}) }}>
      <button style={cardHeaderBtn} onClick={() => setOpen((v) => !v)}>
        <div style={{ textAlign: 'left' }}>
          <div style={cardMenuName}>{item.menu}</div>
          {displayName !== item.menu && <div style={cardMenuTranslated}>{displayName}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...levelPill, color: style.text, background: style.bg, border: `1px solid ${style.border}` }}>
            {level}
          </span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="2.5"
               style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={cardBody}>
          {item.description_translated && (
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10, lineHeight: 1.4 }}>
              {item.description_translated}
            </div>
          )}

          {/* 확정 위험 사유 */}
          {confirmed.length > 0 && (
            <div style={{ ...alertBox, background: style.bg, border: `1px solid ${style.border}`, marginBottom: 8 }}>
              <div style={{ ...alertTitle, color: style.text }}>
                <span style={{ marginRight: 6 }}>⚠️</span>Confirmed Risk Ingredient
              </div>
              {confirmed.map((r, i) => (
                <div key={i} style={alertDesc}>
                  • <strong>{r.ingredient}</strong> ({r.label}) {r.severity ? `- ${r.severity}` : ''}
                </div>
              ))}
            </div>
          )}

          {/* 가능성 위험 사유 */}
          {possible.length > 0 && (
            <div style={{ ...alertBox, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 8 }}>
              <div style={{ ...alertTitle, color: '#D97706' }}>
                <span style={{ marginRight: 6 }}>❓</span>Possible Risk Ingredient (Varies by Restaurant)
              </div>
              {possible.map((r, i) => (
                <div key={i} style={{ ...alertDesc, color: '#92400E' }}>
                  • <strong>{r.ingredient}</strong> ({r.label})
                </div>
              ))}
            </div>
          )}

          {/* 성분 비율 / 그래프 */}
          {withRatio.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={breakdownLabel}>
                INGREDIENT BREAKDOWN {isRealRatio ? '(Based on Actual Weight)' : '(AI Estimated)'}
              </div>
              {withRatio.map((ing, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, width: 110, color: '#334155', fontWeight: ing.tags?.length ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ing.name_translated || ing.name}
                  </span>
                  <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(ing.ratio_percent, 100)}%`, height: '100%', background: style.text, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, width: 32, textAlign: 'right', color: '#64748B' }}>{ing.ratio_percent}%</span>
                </div>
              ))}
            </div>
          )}

          {/* 기타 재료 목록 */}
          {ingredients.filter((i) => typeof i.ratio_percent !== 'number').length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={breakdownLabel}>INGREDIENT BREAKDOWN</div>
              <div style={breakdownText}>
                {ingredients
                  .filter((i) => typeof i.ratio_percent !== 'number')
                  .map((i) => (i.name_translated || i.name) + (i.certainty === 'possible' ? ' (Possible)' : ''))
                  .join(', ')}.
              </div>
            </div>
          )}

          {item.data_source && (
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, textAlign: 'right' }}>
              REASONING: {{ menuzen: 'Public Data (MenuZen)', menu_base: 'Internal Menu Database', menu_board: 'Menu Board', ai: 'AI Inference' }[item.data_source]}
              {item.family?.length > 1 && ` · Compared with ${item.family.length} similar recipes`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const menus = location.state?.menus;
  const ocrText = location.state?.ocrText;

  useEffect(() => {
    if (menus?.length || ocrText) fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const isGuest = localStorage.getItem('isGuest') === 'true';
      const guest = JSON.parse(localStorage.getItem('guestProfile') || 'null');
      const body = {
        ...(menus?.length ? { menus } : { ocr_text: ocrText }),
        ...(isGuest && guest ? { profile: {
          allergies: guest.allergies || [],
          religious_diet: guest.religious_diet || null,
          vegetarian_type: guest.vegetarian_type || null,
          preferred_language: localStorage.getItem('appLanguage') || 'en',
        } } : {}),
      };
      const res = await axios.post(`${API_URL}/analyze`, body, {
        headers: { ...(await authHeader()) },
        timeout: 120000,
      });
      setResults(res.data.results || []);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        setError('Unable to connect to the backend server. Please check if the server is running.');
      } else if (err.code === 'ECONNABORTED') {
        setError('The analysis is taking too long. Please try again later.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (err.response?.status === 500) {
        setError('Something went wrong with the server. Please try again later.');
      } else {
        setError(`An error occurred: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const sorted = [...results].sort(
  (a, b) =>
    (LEVEL_ORDER[b.risk?.level] ?? 0) -
    (LEVEL_ORDER[a.risk?.level] ?? 0)
  );
    
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

          {loading && <div style={loadingBox}>🧠 Analyzing...</div>}
          {error   && <div style={errorBox}>⚠️ {error}</div>}

          {sorted.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sorted.map((item, idx) => (
                <ResultCard key={idx} item={item} />
              ))}
            </div>
          ) : (
            !loading && (
              <div style={emptyBox}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: '#0F172A' }}>No Results Found</div>
                <div style={{ fontSize: 13, color: '#94A3B8' }}>Please go back to the scan page and upload a menu.</div>
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
  return (
    <nav style={bottomNavStyle}>
      <button onClick={() => navigate('/home')} style={navItem(false)}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </button>
      <button onClick={() => navigate('/history')} style={navItem(true)}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>History</span>
      </button>
      <button onClick={() => navigate('/chat')} style={navItem(false)}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Chat</span>
      </button>
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
  width: 20,
  height: 20,
};
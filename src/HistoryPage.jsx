import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { SHOW_HISTORY_CHAT_TABS } from './featureFlags';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LEVEL_CONFIG = {
  SAFE: { text: '#16A34A', bg: '#DCFCE7', badgeBg: '#ECFDF5' },
  CAUTION: { text: '#D97706', bg: '#FEF3C7', badgeBg: '#FFFBEB' },
  WARNING: { text: '#DC2626', bg: '#FEE2E2', badgeBg: '#FEF2F2' },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  /* 1. Supabase 인증 헤더 생성 */
  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

  /* 2. 지난 스캔 이력 불러오기 API 호출 */
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await authHeaders();
        const response = await axios.get(`${API_URL}/history`, { headers, timeout: 15000 });
        
        const rawData = response.data.results || response.data || [];
        const normalizedData = rawData.map((item, idx) => ({
          id: item.id || item.history_id || idx,
          nameKo: item.menu_name || item.nameKo || item.menu || 'Unnamed Dish',
          nameEn: item.menu_translated || item.nameEn || '',
          level: item.risk?.level || item.level || 'SAFE',
          hazardTitle: item.risk?.title || item.hazardTitle || (item.risk?.level === 'WARNING' ? 'Allergy Hazard Detected' : 'Safety Status'),
          hazardDesc: item.risk?.description || item.hazardDesc || item.summary || 'Check detailed allergy information.',
          ingredients: Array.isArray(item.ingredients) 
            ? item.ingredients.join(', ') 
            : (item.ingredients || 'No ingredient information available.'),
        }));

      setHistoryList(normalizedData);
      if (normalizedData.length > 0) setOpenId(normalizedData[0].id);

      } catch (err) {
        console.error('History fetch error:', err);
        setError('Failed to load past analysis results.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  /* 3. 상단 요약 카운트 동적 계산 */
  const summaryCounts = historyList.reduce(
    (acc, item) => {
      const lvl = item.level || item.risk?.level || 'SAFE';
      if (lvl === 'SAFE') acc.safe++;
      else if (lvl === 'CAUTION') acc.caution++;
      else if (lvl === 'WARNING') acc.warning++;
      return acc;
    },
    { safe: 0, caution: 0, warning: 0 }
  );

  const toggleAccordion = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div style={pageOuter}>
      <div style={mobileCard}>
        {/* 헤더 영역 */}
        <header style={headerBar}>
          <button onClick={() => navigate(-1)} style={backBtn} aria-label="Back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={headerTextGroup}>
            <h1 style={headerTitle}>Analysis Results</h1>
            <p style={headerSubtitle}>Jagarchi Grilled Fish Alley, Busan</p>
          </div>
        </header>

        {/* 메인 콘텐츠 스크롤 */}
        <div style={contentScroll}>
          {/* 상단 위험도 요약 카운터 */}
          <div style={summaryCard}>
            <div style={summaryItem}>
              <span style={{ ...countBadge, background: '#DCFCE7', color: '#16A34A' }}>{summaryCounts.safe}</span>
              <span style={summaryLabel}>SAFE</span>
            </div>
            <div style={summaryItem}>
              <span style={{ ...countBadge, background: '#FEF3C7', color: '#D97706' }}>{summaryCounts.caution}</span>
              <span style={summaryLabel}>CAUTION</span>
            </div>
            <div style={summaryItem}>
              <span style={{ ...countBadge, background: '#FEE2E2', color: '#DC2626' }}>{summaryCounts.warning}</span>
              <span style={summaryLabel}>WARNING</span>
            </div>
          </div>

          {/* 로딩 및 에러 상태 처리 */}
          {loading && <div style={statusMessage}>Loading past analysis results...</div>}
          {error && <div style={{ ...statusMessage, color: '#DC2626' }}>{error}</div>}

          {!loading && !error && historyList.length === 0 && (
            <div style={statusMessage}>No scan history found.</div>
          )}

          {/* 지난 스캔 목록 리스트 */}
          {!loading && !error && (
            <div style={accordionList}>
              {historyList.map((item, idx) => {
                const itemId = item.id ?? idx;
                const isOpen = openId === itemId;
                const level = item.level || item.risk?.level || 'SAFE';
                const isWarning = level === 'WARNING';
                const levelStyle = LEVEL_CONFIG[level] || LEVEL_CONFIG.SAFE;

                const nameKo = item.nameKo || item.menu || '메뉴명 없음';
                const nameEn = item.nameEn || item.menu_translated || '';
                const ingredientsStr = Array.isArray(item.ingredients) 
                  ? item.ingredients.join(', ') 
                  : (item.ingredients || '성분 정보 없음');

                return (
                  <div
                    key={itemId}
                    style={{
                      ...cardStyle,
                      border: isOpen && isWarning ? '1.5px solid #DC2626' : '1px solid #F1F5F9',
                    }}
                  >
                    {/* 지난 결과 목록 아이템 헤더 */}
                    <div style={cardHeader} onClick={() => toggleAccordion(itemId)}>
                      <div>
                        <div style={dishNameKo}>{nameKo}</div>
                        {nameEn && <div style={dishNameEn}>{nameEn}</div>}
                      </div>
                      <div style={rightHeaderGroup}>
                        <span style={{ ...levelBadge, color: levelStyle.text, background: levelStyle.bg }}>
                          {level}
                        </span>
                        <svg
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill="none"
                          stroke="#475569"
                          strokeWidth="2"
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* 펼쳤을 때 다시 보이는 상세 분석 결과 */}
                    {isOpen && (
                      <div style={cardBody}>
                        <div style={{ ...hazardBox, background: isWarning ? '#FEF2F2' : levelStyle.badgeBg }}>
                          <div style={hazardHeader}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={levelStyle.text} strokeWidth="2.2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span style={{ ...hazardTitle, color: levelStyle.text }}>
                              {item.hazardTitle || (isWarning ? 'Allergy Hazard Detected' : 'Safety Status')}
                            </span>
                          </div>
                          <p style={hazardDesc}>
                            {item.hazardDesc || item.summary || '알레르기 및 주의 성분을 확인하세요.'}
                          </p>
                        </div>

                        {/* 성분 상세 분해 (INGREDIENT BREAKDOWN) */}
                        <div style={ingredientSection}>
                          <div style={ingredientTitle}>INGREDIENT BREAKDOWN</div>
                          <p style={ingredientText}>{ingredientsStr}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

      {SHOW_HISTORY_CHAT_TABS && (
        <>
          <button onClick={() => navigate('/history')} style={navItem(true)}>
            <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21A9 9 0 1 1 21 12c0 1.25-.26 2.45-.73 3.5" />
              <polyline points="12 7 12 12 15 12" />
              <path d="M18 21V15" />
              <path d="M15 18l3-3 3 3" />
            </svg>
            <span>History</span>
          </button>

          <button onClick={() => navigate('/chat')} style={navItem(false)}>
            <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

const contentScroll = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const summaryCard = {
  background: '#FFFFFF',
  borderRadius: 20,
  padding: '14px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: '1px solid #F1F5F9',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
};

const summaryItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const countBadge = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  fontSize: 12,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const summaryLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: '#475569',
  letterSpacing: '0.2px',
};

const statusMessage = {
  textAlign: 'center',
  fontSize: 13,
  color: '#64748B',
  padding: '24px 0',
};

const accordionList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const cardStyle = {
  background: '#FFFFFF',
  borderRadius: 20,
  padding: '16px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  transition: 'all 0.2s ease',
};

const cardHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
};

const dishNameKo = {
  fontSize: 16,
  fontWeight: 800,
  color: '#0F172A',
};

const dishNameEn = {
  fontSize: 13,
  color: '#64748B',
  marginTop: 2,
};

const rightHeaderGroup = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const levelBadge = {
  fontSize: 10,
  fontWeight: 800,
  padding: '4px 10px',
  borderRadius: 12,
  letterSpacing: '0.3px',
};

const cardBody = {
  marginTop: 14,
  paddingTop: 12,
  borderTop: '1px dashed #F1F5F9',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const hazardBox = {
  borderRadius: 12,
  padding: '12px 14px',
};

const hazardHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
};

const hazardTitle = {
  fontSize: 13,
  fontWeight: 700,
};

const hazardDesc = {
  fontSize: 12,
  color: '#64748B',
  margin: 0,
  lineHeight: 1.45,
};

const ingredientSection = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const ingredientTitle = {
  fontSize: 10,
  fontWeight: 800,
  color: '#94A3B8',
  letterSpacing: '0.5px',
};

const ingredientText = {
  fontSize: 12.5,
  color: '#334155',
  margin: 0,
  lineHeight: 1.5,
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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { SHOW_HISTORY_CHAT_TABS } from './featureFlags';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const BADGE_STYLE = {
  SAFE: { text: '#137333', bg: '#E6F4EA' },
  CAUTION: { text: '#B06000', bg: '#FEF7E0' },
  WARNING: { text: '#C5221F', bg: '#FCE8E6' },
};

/* 날짜 포맷팅 헬퍼 (Today · 7:42 PM / Nov 5 · 12:10 PM) */
function formatScanDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Today · ${timeStr}`;
  }

  const monthDay = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `${monthDay} · ${timeStr}`;
}

/* 상세 헤더용 짧은 날짜 포맷 (Nov 5) */
function formatShortDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* 프로필 객체를 읽기 쉬운 영문 문자열로 변환 */
function formatProfileSummary(prof) {
  if (!prof) return 'No profile';
  const parts = [];
  if (Array.isArray(prof.allergies) && prof.allergies.length > 0) {
    const formatted = prof.allergies
      .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
      .join(', ');
    parts.push(`${formatted} allergy`);
  }
  if (prof.religious_diet && prof.religious_diet !== 'none') {
    parts.push(prof.religious_diet);
  }
  if (prof.vegetarian_type && prof.vegetarian_type !== 'none') {
    parts.push(prof.vegetarian_type);
  }
  return parts.length > 0 ? parts.join(' · ') : 'No restrictions';
}

export default function HistoryPage() {
  const navigate = useNavigate();

  // 목록 & 상세 화면 상태
  const [scanLogs, setScanLogs] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [error, setError] = useState(null);
  const [showAllDishes, setShowAllDishes] = useState(false);

  /* Supabase에서 실제 스캔 기록(건별) 및 현재 프로필 조회 */
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        if (localStorage.getItem('isGuest') === 'true') {
          setScanLogs([]);
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          setScanLogs([]);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, allergies, religious_diet, vegetarian_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profile) {
          setScanLogs([]);
          return;
        }

        setCurrentProfile(profile);

        const { data: logs, error: logsError } = await supabase
          .from('scan_logs')
          .select('id, profile_id, analysis_result, created_at')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false });

        if (logsError) throw logsError;

        const normalizedLogs = (logs || [])
          .map((log) => {
            const results = Array.isArray(log.analysis_result?.results)
              ? log.analysis_result.results
              : [];
            if (results.length === 0) return null;

            let safe = 0;
            let caution = 0;
            let warning = 0;

            const dishes = results.map((item, idx) => {
              const level = item.risk?.level || 'SAFE';
              if (level === 'SAFE') safe++;
              else if (level === 'CAUTION') caution++;
              else if (level === 'WARNING') warning++;

              const reasons = [
                ...(item.risk?.confirmed_reasons || []),
                ...(item.risk?.possible_reasons || []),
              ];

              const reasonText = reasons.length
                ? reasons
                    .map((r) => r.ingredient || r.label || r.tag)
                    .filter(Boolean)
                    .join(', ')
                : '';

              return {
                id: `${log.id}-${idx}`,
                nameKo: item.menu || '메뉴명 없음',
                nameEn: item.menu_translated || item.menu || 'Unknown dish',
                price: item.price || (Array.isArray(item.prices) ? item.prices[0] : null),
                level,
                reasonText,
                staffQuestionsCount: Array.isArray(item.staff_questions)
                  ? item.staff_questions.length
                  : item.staff_question
                  ? 1
                  : 0,
                rawItem: item,
              };
            });

            const topNames = dishes.slice(0, 3).map((d) => d.nameKo);
            const extraCount = dishes.length - topNames.length;
            const summaryLine =
              topNames.join(', ') + (extraCount > 0 ? ` +${extraCount}` : '');

            const scannedProfile =
              log.analysis_result?.profile ||
              log.analysis_result?.applied_profile ||
              profile;

            return {
              id: log.id,
              createdAt: log.created_at,
              dishCount: dishes.length,
              summaryLine,
              counts: { safe, caution, warning },
              dishes,
              scannedProfile,
            };
          })
          .filter(Boolean);

        setScanLogs(normalizedLogs);
      } catch (err) {
        console.error('History fetch error:', err);
        setError('Failed to load past analysis results.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const isProfileChanged = (scan) => {
    if (!scan || !currentProfile || !scan.scannedProfile) return false;
    const prevStr = formatProfileSummary(scan.scannedProfile);
    const currStr = formatProfileSummary(currentProfile);
    return prevStr !== currStr;
  };

  const handleRecheckWithCurrentProfile = async () => {
    if (!selectedScan || rechecking) return;
    setRechecking(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const menuNames = selectedScan.dishes.map((d) => d.nameKo);

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          menus: menuNames,
          profile: {
            allergies: currentProfile?.allergies || [],
            religious_diet: currentProfile?.religious_diet || 'none',
            vegetarian_type: currentProfile?.vegetarian_type || 'none',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to re-check menus');
      }

      const rechecked = await response.json();
      const newResults = Array.isArray(rechecked.results) ? rechecked.results : [];

      if (newResults.length > 0) {
        let safe = 0;
        let caution = 0;
        let warning = 0;

        const updatedDishes = newResults.map((item, idx) => {
          const level = item.risk?.level || 'SAFE';
          if (level === 'SAFE') safe++;
          else if (level === 'CAUTION') caution++;
          else if (level === 'WARNING') warning++;

          const reasons = [
            ...(item.risk?.confirmed_reasons || []),
            ...(item.risk?.possible_reasons || []),
          ];

          return {
            id: `${selectedScan.id}-re-${idx}`,
            nameKo: item.menu || selectedScan.dishes[idx]?.nameKo || '메뉴명 없음',
            nameEn: item.menu_translated || item.menu || 'Unknown dish',
            price: item.price || selectedScan.dishes[idx]?.price || null,
            level,
            reasonText: reasons
              .map((r) => r.ingredient || r.label || r.tag)
              .filter(Boolean)
              .join(', '),
            staffQuestionsCount: Array.isArray(item.staff_questions)
              ? item.staff_questions.length
              : item.staff_question
              ? 1
              : 0,
            rawItem: item,
          };
        });

        setSelectedScan((prev) => ({
          ...prev,
          counts: { safe, caution, warning },
          dishes: updatedDishes,
          scannedProfile: currentProfile,
        }));
      }
    } catch (err) {
      console.error('Re-check error:', err);
      alert('Unable to re-check with your current profile. Please try again.');
    } finally {
      setRechecking(false);
    }
  };

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekLogs = scanLogs.filter(
    (s) => new Date(s.createdAt).getTime() >= sevenDaysAgo
  );
  const earlierLogs = scanLogs.filter(
    (s) => new Date(s.createdAt).getTime() < sevenDaysAgo
  );

  /* =========================================================
     SCR-14-2: 기록 상세 화면 (selectedScan이 선택된 경우)
  ========================================================= */
  if (selectedScan) {
    const visibleDishes = showAllDishes
      ? selectedScan.dishes
      : selectedScan.dishes.slice(0, 4);
    const remainingDishesCount = selectedScan.dishes.length - visibleDishes.length;
    const profileChanged = isProfileChanged(selectedScan);

    return (
      <div style={pageOuter}>
        <div style={mobileCard}>
          {/* 상세 상단 헤더 */}
          <header style={headerBar}>
            <button
              onClick={() => {
                setSelectedScan(null);
                setShowAllDishes(false);
              }}
              style={backBtn}
              aria-label="Back to history"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="#0F172A"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div style={headerTextGroup}>
              <h1 style={headerTitle}>
                {formatShortDate(selectedScan.createdAt)} · {selectedScan.dishCount} dishes
              </h1>
            </div>
          </header>

          {/* 상세 본문 스크롤 (minHeight: 0 추가로 잘림 해결) */}
          <div style={contentScroll}>
            {profileChanged && (
              <div style={profileChangedCard}>
                <div style={profileChangedTitle}>
                  Your profile changed since this scan
                </div>
                <p style={profileChangedDesc}>
                  These results use your old profile. Re-check to apply your current allergies and diet.
                </p>
                <button
                  onClick={handleRecheckWithCurrentProfile}
                  disabled={rechecking}
                  style={recheckBtn}
                >
                  {rechecking ? 'Re-checking...' : 'Re-check with my current profile'}
                </button>
              </div>
            )}

            {/* 상단 SAFE / CAUTION / WARNING 요약 배지 */}
            <div style={detailBadgeRow}>
              <span style={{ ...pillBadge, background: BADGE_STYLE.SAFE.bg, color: BADGE_STYLE.SAFE.text }}>
                {selectedScan.counts.safe}
              </span>
              <span style={{ ...pillBadge, background: BADGE_STYLE.CAUTION.bg, color: BADGE_STYLE.CAUTION.text }}>
                {selectedScan.counts.caution}
              </span>
              <span style={{ ...pillBadge, background: BADGE_STYLE.WARNING.bg, color: BADGE_STYLE.WARNING.text }}>
                {selectedScan.counts.warning}
              </span>
            </div>

            {/* 메뉴 목록 카드 */}
            <div style={menuListCard}>
              {visibleDishes.map((dish, index) => {
                const badgeStyle = BADGE_STYLE[dish.level] || BADGE_STYLE.SAFE;
                const isLast =
                  index === visibleDishes.length - 1 && remainingDishesCount <= 0;

                return (
                  <div
                    key={dish.id}
                    style={{
                      ...dishRow,
                      borderBottom: isLast ? 'none' : '1px solid #F1F5F9',
                    }}
                  >
                    <div style={dishTitleRow}>
                      <span
                        style={{
                          ...statusPill,
                          background: badgeStyle.bg,
                          color: badgeStyle.text,
                        }}
                      >
                        {dish.level}
                      </span>
                      <span style={dishNameEnText}>{dish.nameEn}</span>
                    </div>

                    <div style={dishSubRow}>
                      {dish.nameKo}
                      {dish.price != null
                        ? ` · ${Number(dish.price).toLocaleString()}`
                        : ''}
                    </div>

                    {dish.level === 'WARNING' && dish.reasonText && (
                      <div style={dishMetaText}>Contains {dish.reasonText}</div>
                    )}
                    {dish.level === 'CAUTION' && (
                      <div style={dishAskText}>
                        💬 Ask the staff ({dish.staffQuestionsCount || 1})
                      </div>
                    )}
                  </div>
                );
              })}

              {/* + N more dishes 버튼 */}
              {remainingDishesCount > 0 && (
                <button
                  onClick={() => setShowAllDishes(true)}
                  style={moreDishesBtn}
                >
                  + {remainingDishesCount} more dishes
                </button>
              )}
            </div>
          </div>

          <BottomNav />
        </div>
      </div>
    );
  }

  /* =========================================================
     SCR-14-1: 기록 목록 화면 (기본 뷰)
  ========================================================= */
  return (
    <div style={pageOuter}>
      <div style={mobileCard}>
        <header style={headerBar}>
          <button
            onClick={() => navigate(-1)}
            style={backBtn}
            aria-label="Back"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="#0F172A"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={headerTextGroup}>
            <h1 style={headerTitle}>History</h1>
            <p style={headerSubtitle}>Your past scans</p>
          </div>
        </header>

        <div style={contentScroll}>
          <div style={infoBanner}>
            Scans are saved when you are signed in. Results show the profile you had at that time.
          </div>

          {loading && <div style={statusMessage}>Loading past scans...</div>}
          {error && (
            <div style={{ ...statusMessage, color: '#DC2626' }}>{error}</div>
          )}

          {!loading && !error && scanLogs.length === 0 && (
            <div style={emptyCard}>
              <div style={emptyTitle}>No scans saved yet</div>
              <p style={emptyDesc}>
                Scan a Korean menu from the Home screen to see your safety history here.
              </p>
              <button
                onClick={() => navigate('/home')}
                style={emptyActionBtn}
              >
                Scan a menu
              </button>
            </div>
          )}

          {!loading && !error && thisWeekLogs.length > 0 && (
            <div style={sectionBlock}>
              <div style={sectionLabel}>THIS WEEK</div>
              <div style={scanList}>
                {thisWeekLogs.map((scan) => (
                  <ScanHistoryCard
                    key={scan.id}
                    scan={scan}
                    onSelect={() => {
                      setSelectedScan(scan);
                      setShowAllDishes(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && !error && earlierLogs.length > 0 && (
            <div style={sectionBlock}>
              <div style={sectionLabel}>EARLIER</div>
              <div style={scanList}>
                {earlierLogs.map((scan) => (
                  <ScanHistoryCard
                    key={scan.id}
                    scan={scan}
                    onSelect={() => {
                      setSelectedScan(scan);
                      setShowAllDishes(false);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

function ScanHistoryCard({ scan, onSelect }) {
  return (
    <div style={scanCard} onClick={onSelect}>
      <div style={scanCardTop}>
        <span style={scanDishCount}>{scan.dishCount} dishes</span>
        <span style={scanTimestamp}>{formatScanDate(scan.createdAt)}</span>
      </div>

      <div style={scanMenuSummary}>{scan.summaryLine}</div>

      <div style={scanBadgeRow}>
        <span
          style={{
            ...pillBadge,
            background: BADGE_STYLE.SAFE.bg,
            color: BADGE_STYLE.SAFE.text,
          }}
        >
          {scan.counts.safe}
        </span>
        <span
          style={{
            ...pillBadge,
            background: BADGE_STYLE.CAUTION.bg,
            color: BADGE_STYLE.CAUTION.text,
          }}
        >
          {scan.counts.caution}
        </span>
        <span
          style={{
            ...pillBadge,
            background: BADGE_STYLE.WARNING.bg,
            color: BADGE_STYLE.WARNING.text,
          }}
        >
          {scan.counts.warning}
        </span>
      </div>

      <div style={viewResultsLink}>View results ›</div>
    </div>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav style={bottomNavStyle}>
      <button onClick={() => navigate('/home')} style={navItem(false)}>
        <svg
          style={navIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </button>

      {SHOW_HISTORY_CHAT_TABS && (
        <>
          <button onClick={() => navigate('/history')} style={navItem(true)}>
            <svg
              style={navIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21A9 9 0 1 1 21 12c0 1.25-.26 2.45-.73 3.5" />
              <polyline points="12 7 12 12 15 12" />
              <path d="M18 21V15" />
              <path d="M15 18l3-3 3 3" />
            </svg>
            <span>History</span>
          </button>

          <button onClick={() => navigate('/chat')} style={navItem(false)}>
            <svg
              style={navIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
            </svg>
            <span>Chat</span>
          </button>
        </>
      )}

      <button onClick={() => navigate('/profile')} style={navItem(false)}>
        <svg
          style={navIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}

/* ==================== Inline Styles (스크롤 잘림 수정) ==================== */

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
  height: 'calc(100vh - 32px)',
  minHeight: 680,
  maxHeight: 844,
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
  gap: 10,
  padding: '44px 20px 14px',
  background: '#FFFFFF',
  borderBottom: '1px solid #F1F5F9',
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
  alignItems: 'flex-start',
  textAlign: 'left',
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
  fontSize: 11.5,
  color: '#94A3B8',
  margin: '2px 0 0 0',
  lineHeight: '16px',
};

/* 핵심 수정: minHeight: 0 추가하여 내부 리스트가 길어져도 카드 잘림 없이 스크롤 작동 */
const contentScroll = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '14px 16px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const infoBanner = {
  background: '#EFF6FF',
  borderRadius: 14,
  padding: '12px 14px',
  fontSize: 11.5,
  color: '#475569',
  lineHeight: 1.45,
  textAlign: 'left',
  flexShrink: 0,
};

const sectionBlock = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flexShrink: 0,
};

const sectionLabel = {
  fontSize: 10.5,
  fontWeight: 800,
  color: '#64748B',
  letterSpacing: '0.4px',
  textAlign: 'left',
  paddingLeft: 2,
};

const scanList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const scanCard = {
  background: '#FFFFFF',
  borderRadius: 18,
  padding: '14px 16px',
  border: '1px solid #F1F5F9',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'left',
};

const scanCardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const scanDishCount = {
  fontSize: 15,
  fontWeight: 800,
  color: '#0F172A',
};

const scanTimestamp = {
  fontSize: 11,
  color: '#94A3B8',
  fontWeight: 500,
};

const scanMenuSummary = {
  fontSize: 12,
  color: '#64748B',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const scanBadgeRow = {
  display: 'flex',
  gap: 6,
  marginTop: 2,
};

const pillBadge = {
  minWidth: 28,
  height: 22,
  padding: '0 8px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const viewResultsLink = {
  fontSize: 12,
  fontWeight: 700,
  color: '#1D5BB4',
  marginTop: 2,
};

const emptyCard = {
  background: '#FFFFFF',
  borderRadius: 20,
  padding: '32px 20px',
  border: '1px solid #F1F5F9',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
};

const emptyTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: '#0F172A',
};

const emptyDesc = {
  fontSize: 12,
  color: '#94A3B8',
  margin: 0,
  lineHeight: 1.4,
};

const emptyActionBtn = {
  marginTop: 6,
  padding: '10px 20px',
  background: '#1D5BB4',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 12,
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
};

const statusMessage = {
  textAlign: 'center',
  fontSize: 12.5,
  color: '#64748B',
  padding: '28px 0',
};

const profileChangedCard = {
  background: '#FFF7ED',
  border: '1px solid #FED7AA',
  borderRadius: 18,
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  textAlign: 'left',
  flexShrink: 0,
};

const profileChangedTitle = {
  fontSize: 13.5,
  fontWeight: 800,
  color: '#EA580C',
};

const profileChangedDesc = {
  fontSize: 11.5,
  color: '#64748B',
  margin: 0,
  lineHeight: 1.4,
};

const recheckBtn = {
  marginTop: 4,
  width: '100%',
  padding: '10px 0',
  background: '#FFFFFF',
  border: '1.5px solid #1D5BB4',
  borderRadius: 12,
  color: '#1D5BB4',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
};

const detailBadgeRow = {
  display: 'flex',
  gap: 6,
  flexShrink: 0,
};

/* 핵심 수정: flexShrink: 0 추가하여 내부 항목 확장 시 카드가 찌그러지지 않도록 고정 */
const menuListCard = {
  background: '#FFFFFF',
  borderRadius: 20,
  border: '1px solid #F1F5F9',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  flexShrink: 0,
};

const dishRow = {
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  textAlign: 'left',
};

const dishTitleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const statusPill = {
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 9.5,
  fontWeight: 800,
  letterSpacing: '0.2px',
  flexShrink: 0,
};

const dishNameEnText = {
  fontSize: 14,
  fontWeight: 800,
  color: '#0F172A',
};

const dishSubRow = {
  fontSize: 11.5,
  color: '#64748B',
};

const dishMetaText = {
  fontSize: 11,
  color: '#94A3B8',
};

const dishAskText = {
  fontSize: 11,
  color: '#94A3B8',
};

const moreDishesBtn = {
  width: '100%',
  padding: '12px 16px',
  background: '#FFFFFF',
  border: 'none',
  borderTop: '1px solid #F1F5F9',
  color: '#1D5BB4',
  fontSize: 12,
  fontWeight: 700,
  textAlign: 'left',
  cursor: 'pointer',
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
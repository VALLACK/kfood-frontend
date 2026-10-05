import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import StaffQuestionCard from './StaffQuestionCard';
import { SHOW_HISTORY_CHAT_TABS } from './featureFlags';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LEVEL_ORDER = { SAFE: 0, CAUTION: 1, WARNING: 2 };

const LEVEL_STYLE = {
  SAFE:    { text: '#16A34A', bg: '#ECFDF5', border: '#BBF7D0' },
  CAUTION: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  WARNING: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const KIND_INFO = {
  allergy:          { title: 'Allergy Hazard Detected', preset: 'Allergy' },
  religious:        { title: 'Dietary Restriction Detected', preset: 'Religious Diet' },
  religious_verify: { title: 'Certification Needed', preset: 'Certification' },
  diet:             { title: 'Diet Conflict Detected', preset: 'Diet' },
};

// 데모용 결과 데이터 (실제 /analyze 응답과 동일한 구조)
const DEMO_RESULTS = [
  {
    menu: '해물파전',
    menu_translated: 'Seafood Green Onion Pancake',
    ingredients: [
      { name: '밀가루', name_translated: 'Wheat flour', tags: ['wheat'], certainty: 'confirmed' },
      { name: '대파', name_translated: 'Green Onion', tags: [], certainty: 'confirmed' },
      { name: '오징어', name_translated: 'Squid', tags: ['squid'], certainty: 'confirmed' },
      { name: '조개', name_translated: 'Clams', tags: ['shellfish'], certainty: 'confirmed' },
      { name: '굴', name_translated: 'Oysters', tags: ['shellfish'], certainty: 'confirmed' },
      { name: '달걀', name_translated: 'Egg', tags: ['egg'], certainty: 'confirmed' },
      { name: '마늘', name_translated: 'Garlic', tags: [], certainty: 'confirmed' },
    ],
    risk: {
      level: 'WARNING',
      confirmed_reasons: [
        { kind: 'allergy', tag: 'squid', label: 'Shellfish', ingredient: '오징어', certainty: 'confirmed', severity: '심각' },
        { kind: 'allergy', tag: 'shellfish', label: 'Shellfish', ingredient: '조개', certainty: 'confirmed', severity: '심각' },
        { kind: 'allergy', tag: 'shellfish', label: 'Shellfish', ingredient: '굴', certainty: 'confirmed', severity: '심각' },
      ],
      possible_reasons: [],
      needs_confirmation: false,
      staff_questions: [],
    },
  },
  {
    menu: '순두부찌개',
    menu_translated: 'Soft Tofu Stew',
    ingredients: [
      { name: '순두부', name_translated: 'Soft Tofu', tags: ['soy'], certainty: 'confirmed' },
      { name: '액젓', name_translated: 'Fish Sauce', tags: ['fish'], certainty: 'possible' },
    ],
    risk: {
      level: 'CAUTION',
      confirmed_reasons: [],
      possible_reasons: [{ kind: 'allergy', tag: 'fish', label: 'Fish', ingredient: '액젓', certainty: 'possible', severity: '경미' }],
      needs_confirmation: true,
      staff_questions: [{ kind: 'contains', ingredient: '액젓', tag: 'fish', tags: ['fish'], options: [], ko: '순두부찌개에 액젓이 들어가나요?', translated: 'Does the Soft Tofu Stew contain fish sauce?' }],
    },
  },
  {
    menu: '돌솥비빔밥',
    menu_translated: 'Hot Stone Pot Bibimbap',
    ingredients: [
      { name: '쌀밥', name_translated: 'Rice', tags: [], certainty: 'confirmed' },
      { name: '나물', name_translated: 'Seasoned Vegetables', tags: [], certainty: 'confirmed' },
    ],
    risk: { level: 'SAFE', confirmed_reasons: [], possible_reasons: [], needs_confirmation: false, staff_questions: [] },
  },
];

function groupReasons(reasons) {
  // 같은 표시 라벨(예: shrimp·crab 태그가 둘 다 "Shellfish")은 한 박스로 합침
  const map = new Map();
  for (const r of reasons) {
    if (!r.label) continue;
    const key = `${r.kind}:${r.label}`;
    if (!map.has(key)) {
      map.set(key, { kind: r.kind, label: r.label, certainty: r.certainty, ingredients: [] });
    }
    const g = map.get(key);
    if (!g.ingredients.includes(r.ingredient)) g.ingredients.push(r.ingredient);
    if (r.certainty === 'confirmed') g.certainty = 'confirmed';
  }
  return [...map.values()];
}

function renderBreakdown(ingredients, groups) {
  const tagByName = new Map();
  groups.forEach((g) => g.ingredients.forEach((name) => tagByName.set(name, g)));

  const nodes = [];
  let i = 0;
  while (i < ingredients.length) {
    const ing = ingredients[i];
    const name = ing.name_translated || ing.name;
    const group = tagByName.get(ing.name);
    if (group) {
      const runNames = [name];
      let j = i + 1;
      while (j < ingredients.length && tagByName.get(ingredients[j].name) === group) {
        runNames.push(ingredients[j].name_translated || ingredients[j].name);
        j++;
      }
      nodes.push(
        <span key={i} style={{ color: LEVEL_STYLE.WARNING.text, fontWeight: 700 }}>
          {runNames.join(', ')} ({group.label})
        </span>
      );
      i = j;
    } else {
      nodes.push(<span key={i}>{name}</span>);
      i++;
    }
  }
  return nodes.reduce((acc, node, idx) => {
    if (idx > 0) acc.push(', ');
    acc.push(node);
    return acc;
  }, []);
}

function ResultCard({ item, onUpdated }) {
  const risk = item.risk || {};
  const level = risk.level || 'SAFE';
  const style = LEVEL_STYLE[level];
  const [open, setOpen] = useState(level === 'WARNING');

  const ingredients = item.ingredients || [];
  const groups = groupReasons([...(risk.confirmed_reasons || []), ...(risk.possible_reasons || [])]);
  const staffQuestions = risk.staff_questions || [];
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

      {!open && staffQuestions.length > 0 && (
        <button style={staffHintBtn} onClick={() => setOpen(true)}>
          💬 Ask the staff ({staffQuestions.length}) · Needs confirmation
        </button>
      )}

      {open && (
        <div style={cardBody}>
          {groups.map((g, i) => {
            const info = KIND_INFO[g.kind] || KIND_INFO.allergy;
            return (
              <div key={i} style={{ ...alertBox, background: style.bg, border: `1px solid ${style.border}` }}>
                <div style={{ ...alertTitle, color: style.text }}>
                  <span style={{ marginRight: 6 }}>⚠️</span>{info.title}
                </div>
                <div style={alertDesc}>
                  Contains <strong>{g.label}</strong> ({g.ingredients.join(', ')}) which triggers your {g.label} {info.preset} preset.
                </div>
              </div>
            );
          })}

          {ingredients.length > 0 && (
            <div style={{ marginTop: groups.length > 0 ? 12 : 0 }}>
              <div style={breakdownLabel}>INGREDIENT BREAKDOWN</div>
              <div style={breakdownText}>{renderBreakdown(ingredients, groups)}.</div>
            </div>
          )}

          {staffQuestions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={breakdownLabel}>ASK THE STAFF</div>
              {staffQuestions.map((q, i) => (
                <StaffQuestionCard key={`${q.kind}-${q.ingredient}-${i}`} item={item} question={q} onUpdated={onUpdated} />
              ))}
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
  const [profileApplied, setProfileApplied] = useState(true);

  const isDemo = location.state?.demo;
  const menus = location.state?.menus;
  const ocrText = location.state?.ocrText;

  useEffect(() => {
    if (isDemo) {
      setResults(DEMO_RESULTS);
      return;
    }
    // menus가 있으면 우선 사용 — /ocr이 이미 가격·상호명을 뺀 메뉴명만 정제해서 준 목록이라
    // ocr_text를 그대로 보내 서버가 줄 단위로 재파싱(가격까지 메뉴명에 섞임)하는 것보다 정확함
    if (menus && menus.length > 0) {
      fetchAnalysis({ menus });
    } else if (ocrText) {
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

      const res = await axios.post(`${API_URL}/analyze`, payload, { timeout: 30000, headers });
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
  width: 20,
  height: 20,
};

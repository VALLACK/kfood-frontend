import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 데모용 결과 데이터
const DEMO_RESULTS = [
  {
    menu: '김치찌개',
    ingredients: ['김치', '돼지고기', '두부', '대파', '고춧가루'],
    hidden: ['액젓(생선)', '멸치육수'],
    allergens: ['대두(두부)'],
    contains_pork: true,
    contains_alcohol: false,
    risk: { level: 'WARNING', reasons: ['돼지고기 포함 (할랄 불가)', '액젓(생선) 포함'] },
  },
  {
    menu: '비빔밥',
    ingredients: ['밥', '시금치', '당근', '고사리', '달걀', '고추장'],
    hidden: ['참기름', '간장'],
    allergens: ['달걀', '대두(간장)'],
    contains_pork: false,
    contains_alcohol: false,
    risk: { level: 'CAUTION', reasons: ['달걀 포함 — 비건 불가', '숨겨진 재료: 간장(대두)'] },
  },
  {
    menu: '잡채',
    ingredients: ['당면', '시금치', '당근', '양파', '간장', '참기름'],
    hidden: ['간장(대두)'],
    allergens: ['대두(간장)'],
    contains_pork: false,
    contains_alcohol: false,
    risk: { level: 'SAFE', reasons: [] },
  },
];

const LEVEL_CONFIG = {
  SAFE:    { bg: '#E8F5E9', border: '#4A7C59', color: '#2E6B43', icon: '✅', label: '섭취 가능',  labelKo: 'SAFE' },
  CAUTION: { bg: '#FFF8E1', border: '#E8A838', color: '#7a5a00', icon: '⚠️', label: '확인 필요',  labelKo: 'CAUTION' },
  WARNING: { bg: '#FFEBEE', border: '#B94A2C', color: '#7a1a1a', icon: '🚫', label: '섭취 불가',  labelKo: 'WARNING' },
};

function ResultCard({ item }) {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CONFIG[item.risk.level];
  return (
    <div style={{ ...cardBase, borderColor: cfg.border, background: cfg.bg }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 17, color: '#1A1A1A' }}>{item.menu}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, letterSpacing: 1 }}>{cfg.labelKo} — {cfg.label}</div>
        </div>
        <button onClick={() => setOpen(v => !v)} style={toggleBtn}>{open ? '접기' : '상세'}</button>
      </div>

      {/* 위험 이유 */}
      {item.risk.reasons.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {item.risk.reasons.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: cfg.color, padding: '2px 0' }}>• {r}</div>
          ))}
        </div>
      )}

      {/* 상세 펼치기 */}
      {open && (
        <div style={{ borderTop: `1px solid ${cfg.border}`, marginTop: 8, paddingTop: 12 }}>
          <div style={detailRow}>
            <span style={detailLabel}>주요 성분</span>
            <span style={detailVal}>{item.ingredients.join(', ')}</span>
          </div>
          {item.hidden.length > 0 && (
            <div style={detailRow}>
              <span style={{ ...detailLabel, color: '#E8A838' }}>숨겨진 재료</span>
              <span style={detailVal}>{item.hidden.join(', ')}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={tagBadge(item.contains_pork ? '#B94A2C' : '#4A7C59')}>
              {item.contains_pork ? '🐷 돼지고기 포함' : '🐷 돼지고기 없음'}
            </span>
            <span style={tagBadge(item.contains_alcohol ? '#B94A2C' : '#4A7C59')}>
              {item.contains_alcohol ? '🍺 알코올 포함' : '🍺 알코올 없음'}
            </span>
          </div>
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
  const [profileId, setProfileId] = useState(
  localStorage.getItem('profile_id') || ''
);

  const isDemo = location.state?.demo;
  const ocrText = location.state?.ocrText;

  useEffect(() => {
    if (isDemo) {
      setResults(DEMO_RESULTS);
      return;
    }
    if (ocrText) {
      fetchAnalysis(ocrText);
    }
  }, []);

  const fetchAnalysis = async (text) => {
  setLoading(true);
  setError('');
  try {
    const res = await axios.post(`${API_URL}/analyze`, {
      ocr_text: text,
      profile_id: localStorage.getItem('profile_id') || null,
    }, { timeout: 30000 });
    setResults(res.data.results || []);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
      setError('백엔드 서버에 연결할 수 없어요. 서버가 실행 중인지 확인해주세요. (uvicorn main:app --reload)');
    } else if (err.code === 'ECONNABORTED') {
      setError('분석 시간이 너무 오래 걸려요. 잠시 후 다시 시도해주세요.');
    } else if (err.response?.status === 500) {
      setError('서버 내부 오류가 발생했어요. 백엔드 터미널에서 에러를 확인해주세요.');
    } else if (err.response?.status === 429) {
      setError('AI API 요청 한도를 초과했어요. 잠시 후 다시 시도해주세요.');
    } else {
      setError(`오류가 발생했어요: ${err.message}`);
    }
    setResults(DEMO_RESULTS);
  } finally {
    setLoading(false);
  }
};

  const summary = {
    WARNING: results.filter(r => r.risk.level === 'WARNING').length,
    CAUTION: results.filter(r => r.risk.level === 'CAUTION').length,
    SAFE:    results.filter(r => r.risk.level === 'SAFE').length,
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/scan')} style={backBtn}>← 다시 스캔</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
          {isDemo ? '📊 데모 결과' : '📊 분석 결과'}
        </h2>
      </div>

      {/* 요약 배지 */}
      {results.length > 0 && (
        <div style={summaryRow}>
          {Object.entries(summary).map(([level, count]) => {
            const cfg = LEVEL_CONFIG[level];
            return (
              <div key={level} style={{ ...summaryBadge, background: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
                {cfg.icon} {level} {count}개
              </div>
            );
          })}
        </div>
      )}

      {loading && <div style={loadingBox}>🧠 AI가 성분을 분석 중이에요...</div>}
      {error   && <div style={errorBox}>⚠️ {error}</div>}

      {results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {results.map((item, i) => <ResultCard key={i} item={item} />)}
        </div>
      ) : (
        !loading && (
          <div style={emptyBox}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>결과가 없어요</div>
            <div style={{ fontSize: 13, color: '#888' }}>스캔 페이지로 돌아가서 메뉴판을 업로드해주세요.</div>
          </div>
        )
      )}

      {isDemo && (
        <div style={demoBanner}>
          ℹ️ 데모 화면이에요. 실제 백엔드 서버를 켜고 스캔하면 실제 분석 결과가 나와요.
        </div>
      )}
    </div>
  );
}

const pageStyle   = { maxWidth: 520, margin: '0 auto', padding: '32px 20px' };
const backBtn     = { background: 'none', border: '1px solid #E0D8CC', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#666' };
const summaryRow  = { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' };
const summaryBadge = { padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1.5px solid' };
const loadingBox  = { textAlign: 'center', padding: '40px 20px', fontSize: 15, color: '#666' };
const errorBox = {background: '#FFF0F0', border: '1.5px solid #B94A2C', borderRadius: 8, padding: '14px 18px', fontSize: 13, color: '#B94A2C', marginBottom: 16, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 8};
const emptyBox    = { textAlign: 'center', padding: '60px 20px', color: '#888' };
const demoBanner  = { marginTop: 24, background: '#EEF4FF', border: '1px solid #3B6EA8', borderRadius: 4, padding: '12px 16px', fontSize: 12, color: '#1a3a6b' };
const cardBase    = { border: '2px solid', borderRadius: 10, padding: '16px', transition: 'box-shadow .2s' };
const toggleBtn   = { background: 'none', border: '1px solid currentColor', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, opacity: 0.7 };
const detailRow   = { display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' };
const detailLabel = { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#888', minWidth: 70, marginTop: 1 };
const detailVal   = { fontSize: 12, color: '#333', lineHeight: 1.6 };
const tagBadge    = (color) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: color + '22', color, fontWeight: 700, border: `1px solid ${color}44` });

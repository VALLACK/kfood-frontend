import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import Profile from './Profile';
import ScanPage from './ScanPage';
import ResultPage from './ResultPage';
import './App.css';

function Home() {
  return (
    <div style={homeStyle}>
      <div style={heroBadge}>🌶️ K-Food Safety Guide</div>
      <h1 style={heroTitle}>한국 음식, 이제 안심하고 <br /> 즐겨보세요.</h1>
      <p style={heroDesc}>
        메뉴판을 촬영하면 AI가 음식 정보를 분석하여 <br /> 알레르기·종교·식단에 맞는 안전 여부를 알려드려요.
      </p>
      <div style={btnRow}>
        <Link to="/scan" style={btnSecondary} className="scanButton">📸 메뉴판 스캔하기 →</Link>
      </div>

      {/* 주요 기능 */}
      <div style={featureGrid}>

        <div style={featureCard}>
          <div style={featureIcon}>📸</div>
          <div style={featureTitle}>OCR 스캔</div>
          <div style={featureDesc}>
            메뉴판 사진을<br />
            텍스트로 인식
          </div>
        </div>

        <div style={featureCard}>
          <div style={featureIcon}>🧠</div>
          <div style={featureTitle}>AI 성분 분석</div>
          <div style={featureDesc}>
            음식의 재료와<br />
            성분을 분석
          </div>
        </div>

        <div style={featureCard}>
          <div style={featureIcon}>🛡️</div>
          <div style={featureTitle}>위험도 표시</div>
          <div style={featureDesc}>
            Safe · Caution<br />
            Warning
          </div>
        </div>

        <div style={featureCard}>
          <div style={featureIcon}>🌍</div>
          <div style={featureTitle}>다국어 지원</div>
          <div style={featureDesc}>
            다양한 언어로<br />
            결과 확인
          </div>
        </div>

      </div>

    </div>
  );
}

function NavBar() {
  return (
    <nav style={navStyle}>
      <Link to="/home" style={navLogo}>
        🌶️ K-Food
      </Link>

      <Link to="/profile" style={navLink}>
        내 정보
      </Link>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<><NavBar /><Home /></>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scan" element={<><NavBar /><ScanPage /></>} />
        <Route path="/result" element={<><NavBar /><ResultPage /></>} />
      </Routes>
    </Router>
  );
}

export default App;

const homeStyle    = { maxWidth: 600, margin: '0 auto', padding: '48px 24px', textAlign: 'center' };
const heroBadge    = { display: 'inline-block', background: '#B94A2C', color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: '4px 14px', borderRadius: 2, marginBottom: 20 };
const heroTitle    = { fontSize: 'clamp(24px,5vw,40px)', fontWeight: 900, lineHeight: 1.3, marginBottom: 16, color: '#1A1A1A' };
const heroDesc     = { fontSize: 15, color: '#666', lineHeight: 1.8, marginBottom: 32 };
const btnRow       = { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 };
const btnSecondary = { background: '#fff', color: '#B94A2C', padding: '12px 28px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, fontSize: 14, border: '2px solid #B94A2C' };
const featureGrid  = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 };
const featureCard  = { background: '#fff', border: '1px solid #E0D8CC', borderRadius: 8, padding: '20px 16px', textAlign: 'center' };
const featureIcon = {
  fontSize: 28,
  marginBottom: 10,
};

const featureTitle = {
  fontWeight: 700,
  fontSize: 14,
  marginBottom: 6,
  color: '#1A1A1A',
};

const featureDesc = {
  fontSize: 12,
  color: '#888',
  lineHeight: 1.6,
};
const navStyle     = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: '#1A1A1A', borderBottom: '3px solid #B94A2C', position: 'sticky', top: 0, zIndex: 100 };
const navLogo      = { color: '#fff', textDecoration: 'none', fontWeight: 900, fontSize: 18, letterSpacing: 1 };
const navLink      = { color: '#bbb', textDecoration: 'none', fontSize: 13, padding: '6px 14px', borderRadius: 4 };


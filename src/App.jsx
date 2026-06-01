import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Profile from './Profile';
import ScanPage from './ScanPage';
import ResultPage from './ResultPage';
import './App.css';

function Home() {
  return (
    <div style={homeStyle}>
      <div style={heroBadge}>🌶️ K-Food Safety Guide</div>
      <h1 style={heroTitle}>외국인도 안심하고<br />한국 음식을 즐길 수 있도록</h1>
      <p style={heroDesc}>
        메뉴판을 촬영하면 AI가 성분을 분석하고<br />
        알레르기·종교·식단에 맞는 안전 여부를 알려드려요.
      </p>
      <div style={btnRow}>
        <Link to="/profile" style={btnPrimary}>프로필 설정하기 →</Link>
        <Link to="/scan" style={btnSecondary}>바로 스캔하기</Link>
      </div>
      <div style={featureGrid}>
        {[
          { icon: '📸', title: 'OCR 스캔', desc: '메뉴판 사진만 찍으면 끝' },
          { icon: '🧠', title: 'AI 성분 추론', desc: '숨겨진 재료까지 분석' },
          { icon: '🛡️', title: '위험도 표시', desc: 'Safe · Caution · Warning' },
          { icon: '🌍', title: '다국어 지원', desc: 'EN · ZH · JA' },
        ].map(f => (
          <div key={f.title} style={featureCard}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBar() {
  return (
    <nav style={navStyle}>
      <Link to="/" style={navLogo}>🌶️ K-Food</Link>
      <div style={navLinks}>
        <Link to="/profile" style={navLink}>프로필</Link>
        <Link to="/scan" style={navLink}>스캔</Link>
        <Link to="/result" style={navLink}>결과</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/result" element={<ResultPage />} />
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
const btnPrimary   = { background: '#B94A2C', color: '#fff', padding: '12px 28px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, fontSize: 14 };
const btnSecondary = { background: '#fff', color: '#B94A2C', padding: '12px 28px', borderRadius: 4, textDecoration: 'none', fontWeight: 700, fontSize: 14, border: '2px solid #B94A2C' };
const featureGrid  = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 };
const featureCard  = { background: '#fff', border: '1px solid #E0D8CC', borderRadius: 8, padding: '20px 16px', textAlign: 'center' };
const navStyle     = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56, background: '#1A1A1A', borderBottom: '3px solid #B94A2C', position: 'sticky', top: 0, zIndex: 100 };
const navLogo      = { color: '#fff', textDecoration: 'none', fontWeight: 900, fontSize: 18, letterSpacing: 1 };
const navLinks     = { display: 'flex', gap: 8 };
const navLink      = { color: '#bbb', textDecoration: 'none', fontSize: 13, padding: '6px 14px', borderRadius: 4 };

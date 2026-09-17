import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './Login';
import Profile from './Profile';
import ScanPage from './ScanPage';
import ResultPage from './ResultPage';
import './App.css';

function Home() {
  return (
    <div style={homeContainer}>
      <div style={homeStyle}>
        {/* 상단 히어로 배너 */}
        <div style={heroBadge}>🌶️ K-Food Safety Guide</div>
        <h1 style={heroTitle}>
          한국 음식, 이제 안심하고<br />즐겨보세요.
        </h1>
        <p style={heroDesc}>
          메뉴판을 촬영하면 AI가 음식 정보를 분석하여<br />
          알레르기·종교·식단에 맞는 안전 여부를 알려드려요.
        </p>

        {/* 메인 액션 버튼 */}
        <div style={btnRow}>
          <Link to="/scan" style={btnPrimary}>
            <span style={{ fontSize: 20 }}>📸</span>
            <span>메뉴판 스캔하러 가기</span>
            <span style={{ marginLeft: 4 }}>→</span>
          </Link>
        </div>

        {/* 주요 기능 4가지 카드 */}
        <div style={featureSection}>
          <h2 style={sectionTitle}>주요 기능</h2>
          <div style={featureGrid}>
            <div style={featureCard}>
              <div style={featureIconWrapper}>📸</div>
              <div style={featureTitle}>OCR 스캔</div>
              <div style={featureDesc}>
                메뉴판 사진을<br />텍스트로 자동 인식
              </div>
            </div>

            <div style={featureCard}>
              <div style={featureIconWrapper}>🧠</div>
              <div style={featureTitle}>AI 성분 분석</div>
              <div style={featureDesc}>
                음식 재료와<br />주의 성분을 정밀 분석
              </div>
            </div>

            <div style={featureCard}>
              <div style={featureIconWrapper}>🛡️</div>
              <div style={featureTitle}>위험도 표시</div>
              <div style={featureDesc}>
                Safe · Caution · Warning<br />3단계 안전 진단
              </div>
            </div>

            <div style={featureCard}>
              <div style={featureIconWrapper}>🌍</div>
              <div style={featureTitle}>다국어 지원</div>
              <div style={featureDesc}>
                외국인도 쉽게 이해하는<br />다국어 가이드
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('로그아웃 실패:', error.message);
      return;
    }

    navigate('/');
  };

  return (
    <nav style={navStyle}>
      <div style={navInner}>
        <Link to="/home" style={navLogo}>
          <span style={{ fontSize: 22 }}>🌶️</span>
          <span style={navLogoText}>K-Food Safety</span>
        </Link>

        <div style={navMenu}>
          <Link to="/profile" style={navLink}>
            👤 내 설정
          </Link>

          <button onClick={handleLogout} style={logoutButton}>
            로그아웃
          </button>
        </div>
      </div>
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

/* ==================== Inline Styles ==================== */

const navStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: '#FFFFFF',
  borderBottom: '1px solid #F3F4F6',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
};

const navInner = {
  maxWidth: 800,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
  height: 60,
};

const navLogo = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  textDecoration: 'none',
};

const navLogoText = {
  color: '#111827',
  fontWeight: 800,
  fontSize: 17,
  letterSpacing: '-0.5px',
};

const navMenu = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const navLink = {
  color: '#374151',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 8,
  background: '#F9FAFB',
  transition: 'all 0.2s ease',
};

const logoutButton = {
  background: 'transparent',
  color: '#9CA3AF',
  border: 'none',
  fontSize: 13,
  fontWeight: 500,
  padding: '6px 10px',
  cursor: 'pointer',
  outline: 'none',
};

const homeContainer = {
  minHeight: 'calc(100vh - 60px)',
  background: '#F9FAFB',
  paddingBottom: 60,
};

const homeStyle = {
  maxWidth: 580,
  margin: '0 auto',
  padding: '40px 20px 0',
  textAlign: 'center',
};

const heroBadge = {
  display: 'inline-block',
  background: '#FEF2F2',
  color: '#DC2626',
  fontSize: 13,
  fontWeight: 700,
  padding: '6px 16px',
  borderRadius: 20,
  marginBottom: 20,
  border: '1px solid #FEE2E2',
};

const heroTitle = {
  fontSize: 'clamp(26px, 5vw, 36px)',
  fontWeight: 800,
  lineHeight: 1.35,
  marginBottom: 16,
  color: '#111827',
  letterSpacing: '-0.5px',
};

const heroDesc = {
  fontSize: 15,
  color: '#6B7280',
  lineHeight: 1.6,
  marginBottom: 32,
};

const btnRow = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 48,
};

const btnPrimary = {
  width: '100%',
  maxWidth: 360,
  height: 56,
  background: '#DC2626',
  color: '#FFFFFF',
  borderRadius: 16,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 6px 20px rgba(220, 38, 38, 0.25)',
  outline: 'none',
};

const featureSection = {
  textAlign: 'left',
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 16,
  textAlign: 'center',
};

const featureGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
};

const featureCard = {
  background: '#FFFFFF',
  border: '1px solid #F3F4F6',
  borderRadius: 16,
  padding: '24px 16px',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
};

const featureIconWrapper = {
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: '#F9FAFB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  margin: '0 auto 12px',
};

const featureTitle = {
  fontWeight: 700,
  fontSize: 15,
  marginBottom: 6,
  color: '#111827',
};

const featureDesc = {
  fontSize: 12,
  color: '#9CA3AF',
  lineHeight: 1.5,
};
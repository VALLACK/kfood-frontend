import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './Login';
import Profile from './Profile';
import ScanPage from './ScanPage';
import ResultPage from './ResultPage';
import './App.css';

function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // Supabase에서 유저의 프로필(알레르기, 종교, 식단) 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
      // Google OAuth 프로필 이미지 가져오기
      const googleAvatar = user.user_metadata?.avatar_url;
      setAvatarUrl(googleAvatar || 'https://cdn-icons-png.flaticon.com/512/847/847969.png');

      const { data, error } = await supabase
        .from('profiles')
        .select('allergies, religious_diet, vegetarian_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
    }
    setLoading(false);
  };

  fetchProfile();
}, []);

const LABEL_MAP = {
    peanuts: 'Peanuts',
    shellfish: 'Shellfish',
    eggs: 'Eggs',
    dairy: 'Dairy',
    gluten: 'Gluten',
    soy: 'Soy',
    sesame: 'Sesame',
    tree_nuts: 'Tree Nuts',
    halal: 'Halal',
    kosher: 'Kosher',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
  };

  const getLabel = (value) => LABEL_MAP[value] || null;

  return (
    <div style={homeContainer}>
      <div style={mobileCard}>
        {/* 1. 상단 헤더 */}
        <header style={headerStyle}>
          <div style={logoWrapper}>
            <div style={shieldBadge}>
              <svg style={shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 11 12 14 22 4" />
              </svg>
            </div>
            <span style={logoText}>K-Food Safety</span>
          </div>

          <Link to="/profile">
            <img
              src={avatarUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
              alt="Profile"
              style={avatarImg}
            />
          </Link>
        </header>

        <main style={mainContent}>
          {/* 2. 대형 스캔 카드 */}
          <section style={scanCard}>
            <h1 style={scanTitle}>Scan & Eat Safely</h1>
            <p style={scanDesc}>
              Point your camera at any Korean menu to translate and check safety risks instantly
            </p>

            <button onClick={() => navigate('/scan')} style={cameraCircleBtn}>
              <svg style={cameraIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            <span style={scanBtnText}>Scan Menu</span>
          </section>

          {/* 3. 동적 프로필 태그 섹션 (Supabase 연동) */}
          <section style={filterSection}>
            <div style={filterHeader}>
              <h2 style={filterTitle}>My Dietary Filter Profile</h2>
              <Link to="/profile" style={editLink}>Edit</Link>
            </div>

            <div style={filterCard}>
              <p style={filterCardDesc}>
                We are flagging risks based on your preset conditions:
              </p>

              <div style={tagRow}>
                {loading ? (
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Loading profile...</span>
                ) : (
                  <>
                    {/* 알레르기 항목들 (레드 태그) */}
                    {profile?.allergies && profile.allergies.length > 0 && 
                      profile.allergies
                        .filter((allergyKey) => getLabel(allergyKey) !== null)
                        .map((allergyKey) => (
                          <span key={allergyKey} style={redTag}>
                            No {getLabel(allergyKey)}
                          </span>
                      ))
                    }

                    {/* 종교적 식단 (블루 태그) */}
                    {profile?.religious_diet && (
                      <span style={blueTag}>
                        {getLabel(profile.religious_diet)}
                      </span>
                    )}

                    {/* 채식/식단 유형 (블루 태그) */}
                    {profile?.vegetarian_type && (
                      <span style={blueTag}>
                        {getLabel(profile.vegetarian_type)}
                      </span>
                    )}

                    {/* 설정된 항목이 하나도 없을 때 표시 */}
                    {(!profile?.allergies?.length && !profile?.religious_diet && !profile?.vegetarian_type) && (
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>
                        No filter settings found. Tap Edit to set up.
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

    
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  return (
    <nav style={bottomNavStyle}>
      <button onClick={() => navigate('/home')} style={navItem(currentPath === '/home')}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </button>

      <button onClick={() => navigate('/history')} style={navItem(currentPath === '/history')}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>History</span>
      </button>

      <button onClick={() => navigate('/chat')} style={navItem(currentPath === '/chat')}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Chat</span>
      </button>

      <button onClick={() => navigate('/profile')} style={navItem(currentPath === '/profile')}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}

export default App;

/* ==================== Inline Styles ==================== */

const homeContainer = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#333333', // 프레임 외곽 다크 영역
  padding: '16px',
  boxSizing: 'border-box',
};

const mobileCard = {
  width: '100%',
  maxWidth: 390,
  minHeight: 780,
  background: '#F8FAFC',
  borderRadius: 36,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '48px 24px 16px',
  background: '#F8FAFC',
};

const logoWrapper = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const shieldBadge = {
  width: 32,
  height: 32,
  borderRadius: 10,
  background: '#1D5BB4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const shieldIcon = {
  width: 18,
  height: 18,
  color: '#FFFFFF',
};

const logoText = {
  fontSize: 18,
  fontWeight: 800,
  color: '#0F172A',
  letterSpacing: '-0.3px',
};

const avatarImg = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  objectFit: 'cover',
};

const mainContent = {
  flex: 1,
  padding: '0 20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

/* 2. 대형 카메라 스캔 카드 */
const scanCard = {
  background: '#FFFFFF',
  borderRadius: 24,
  padding: '28px 20px 24px',
  textAlign: 'center',
  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const scanTitle = {
  fontSize: 22,
  fontWeight: 800,
  color: '#0F172A',
  margin: '0 0 8px 0',
  letterSpacing: '-0.3px',
};

const scanDesc = {
  fontSize: 13,
  color: '#64748B',
  lineHeight: 1.45,
  margin: '0 0 20px 0',
  maxWidth: 280,
};

const cameraCircleBtn = {
  width: 100,
  height: 100,
  borderRadius: '50%',
  background: '#1D5BB4',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  marginBottom: 12,
  boxShadow: '0 8px 20px rgba(29, 91, 180, 0.3)',
};

const cameraIcon = {
  width: 44,
  height: 44,
  color: '#FFFFFF',
};

const scanBtnText = {
  fontSize: 16,
  fontWeight: 700,
  color: '#1D5BB4',
};

/* 3. My Dietary Filter Profile */
const filterSection = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const filterHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 4px',
};

const filterTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#0F172A',
  margin: 0,
};

const editLink = {
  fontSize: 14,
  fontWeight: 600,
  color: '#1D5BB4',
  textDecoration: 'none',
};

const filterCard = {
  background: '#FFFFFF',
  borderRadius: 16,
  padding: '16px',
  border: '1px solid #F1F5F9',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const filterCardDesc = {
  fontSize: 12,
  color: '#64748B',
  margin: '0 0 12px 0',
  lineHeight: 1.4,
};

const tagRow = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const redTag = {
  padding: '6px 14px',
  borderRadius: 20,
  border: '1px solid #FCA5A5',
  background: '#FEF2F2',
  color: '#DC2626',
  fontSize: 13,
  fontWeight: 600,
};

const blueTag = {
  padding: '6px 14px',
  borderRadius: 20,
  border: '1px solid #1D5BB4',
  background: '#EFF6FF',
  color: '#1D5BB4',
  fontSize: 13,
  fontWeight: 600,
};


/* 5. 하단 탭 네비게이션 */
const bottomNavStyle = {
  marginTop: 'auto',
  height: 64,
  background: '#FFFFFF',
  borderTop: '1px solid #F1F5F9',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '0 8px',
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
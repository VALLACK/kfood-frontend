import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './Login';
import Profile from './Profile';
import ScanPage from './ScanPage';
import ResultPage from './ResultPage';
import HistoryPage from './HistoryPage';
import ChatPage from './ChatPage';
import './App.css';
import { SHOW_HISTORY_CHAT_TABS } from './featureFlags';

function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // 프로필 정보 조회 (게스트: localStorage / 로그인: Supabase DB)
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const guestFlag = localStorage.getItem('isGuest') === 'true';

        if (guestFlag) {
          if (isMounted) {
            setIsGuest(true);
            setAvatarUrl('https://cdn-icons-png.flaticon.com/512/847/847969.png');
            
            // 게스트 저장소에서 프로필 읽기
            const savedGuestData = localStorage.getItem('guestProfile');
            if (savedGuestData) {
              setProfile(JSON.parse(savedGuestData));
            }
            setLoading(false);
          }
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const googleAvatar = user.user_metadata?.avatar_url;
          if (isMounted) {
            setAvatarUrl(googleAvatar || 'https://cdn-icons-png.flaticon.com/512/847/847969.png');
          }

          const { data, error } = await supabase
            .from('profiles')
            .select('allergies, religious_diet, vegetarian_type')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!error && data && isMounted) {
            setProfile(data);
          }
        } else {
          if (isMounted) setIsGuest(true);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
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
        {/* 상단 헤더 */}
        <header style={headerStyle}>
          <div style={logoWrapper}>
            <div style={shieldBadge}>
              <svg style={shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="8 12 11 14.5 16 9.5" />
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
          {/* 스캔 카드 */}
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

          {/* 프로필 태그 영역 (게스트 모드에서도 동적 태그 렌더링) */}
          <section style={filterSection}>
            <div style={filterHeader}>
              <h2 style={filterTitle}>My Dietary Filter Profile</h2>
              <Link to="/profile" style={editLink}>Edit</Link>
            </div>

            <div style={filterCard}>
              <p style={filterCardDesc}>
                {isGuest 
                  ? "We are flagging risks based on your temporary guest conditions:" 
                  : "We are flagging risks based on your preset conditions:"
                }
              </p>

              <div style={tagRow}>
                {loading ? (
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Loading profile...</span>
                ) : (
                  <>
                    {/* 알레르기 태그 */}
                    {profile?.allergies && profile.allergies.length > 0 && 
                      profile.allergies
                        .filter((allergyKey) => getLabel(allergyKey) !== null)
                        .map((allergyKey) => (
                          <span key={allergyKey} style={redTag}>
                            No {getLabel(allergyKey)}
                          </span>
                        ))
                    }

                    {/* 종교적 식단 태그 */}
                    {profile?.religious_diet && (
                      <span style={blueTag}>
                        {getLabel(profile.religious_diet)}
                      </span>
                    )}

                    {/* 채식/식단 태그 */}
                    {profile?.vegetarian_type && (
                      <span style={blueTag}>
                        {getLabel(profile.vegetarian_type)}
                      </span>
                    )}

                    {/* 설정 데이터가 없을 경우 */}
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

        <HomeBottomNav />
      </div>
    </div>
  );
}

function HomeBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
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
        <button onClick={() => navigate('/home')} style={navItem(true)}>
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
              style={navItem(false)}
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
              style={navItem(false)}
            >
              <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
              </svg>
              <span>Chat</span>
            </button>
          </>
        )}

        {/* Profile */}
        <button onClick={() => navigate('/profile')} style={navItem(false)}>
          <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </button>
      </nav>

      {showLoginModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={modalCloseButton}
              aria-label="Close"
            >
              ×
            </button>

            <div style={modalIcon}>
              <svg width="30" height="30" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 style={modalTitle}>Login Required</h2>

            <p style={modalDescription}>
              Sign in to access your {selectedFeature} features.
            </p>

            <button
              onClick={() => navigate('/')}
              style={modalLoginButton}
            >
              Log In
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              style={modalCancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
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
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Router>
  );
}

export default App;

/* Inline Styles */
const homeContainer = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#333333', padding: '16px', boxSizing: 'border-box' };
const mobileCard = { width: '100%', maxWidth: 390, minHeight: 780, background: '#F8FAFC', borderRadius: 36, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '48px 24px 16px', background: '#F8FAFC' };
const logoWrapper = { display: 'flex', alignItems: 'center', gap: 10 };
const shieldBadge = { width: 32, height: 32, borderRadius: 10, background: '#1D5BB4', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const shieldIcon = { width: 18, height: 18, color: '#FFFFFF' };
const logoText = { fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' };
const avatarImg = { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' };
const mainContent = { flex: 1, padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 };
const scanCard = { background: '#FFFFFF', borderRadius: 24, padding: '28px 20px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const scanTitle = { fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-0.3px' };
const scanDesc = { fontSize: 13, color: '#64748B', lineHeight: 1.45, margin: '0 0 20px 0', maxWidth: 280 };
const cameraCircleBtn = { width: 100, height: 100, borderRadius: '50%', background: '#1D5BB4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, boxShadow: '0 8px 20px rgba(29, 91, 180, 0.3)' };
const cameraIcon = { width: 44, height: 44, color: '#FFFFFF' };
const scanBtnText = { fontSize: 16, fontWeight: 700, color: '#1D5BB4' };
const filterSection = { display: 'flex', flexDirection: 'column', gap: 10 };
const filterHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' };
const filterTitle = { fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 };
const editLink = { fontSize: 14, fontWeight: 600, color: '#1D5BB4', textDecoration: 'none' };
const filterCard = { background: '#FFFFFF', borderRadius: 16, padding: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const filterCardDesc = { fontSize: 12, color: '#64748B', margin: '0 0 12px 0', lineHeight: 1.4 };
const tagRow = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const redTag = { padding: '6px 14px', borderRadius: 20, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600 };
const blueTag = { padding: '6px 14px', borderRadius: 20, border: '1px solid #1D5BB4', background: '#EFF6FF', color: '#1D5BB4', fontSize: 13, fontWeight: 600 };
const bottomNavStyle = { marginTop: 'auto', height: 64, background: '#FFFFFF', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 8px' };
const navItem = (isActive) => ({ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: isActive ? '#1D5BB4' : '#94A3B8', fontSize: 11, fontWeight: isActive ? 700 : 500, cursor: 'pointer', padding: '4px 8px' });
const navIcon = { width: 22, height: 22 };

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
  zIndex: 9999,
};

const modalCard = {
  position: 'relative',
  width: '100%',
  maxWidth: 320,
  boxSizing: 'border-box',
  padding: '32px 24px 24px',
  background: '#FFFFFF',
  borderRadius: 24,
  textAlign: 'center',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
};

const modalCloseButton = {
  position: 'absolute',
  top: 10,
  right: 14,
  background: 'none',
  border: 'none',
  fontSize: 28,
  color: '#94A3B8',
  cursor: 'pointer',
};

const modalIcon = {
  width: 64,
  height: 64,
  margin: '0 auto 18px',
  borderRadius: 20,
  background: '#EFF6FF',
  color: '#1D5BB4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalTitle = {
  margin: '0 0 10px',
  fontSize: 22,
  fontWeight: 800,
  color: '#0F172A',
};

const modalDescription = {
  margin: '0 0 24px',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#64748B',
};

const modalLoginButton = {
  width: '100%',
  padding: 14,
  border: 'none',
  borderRadius: 12,
  background: '#1D5BB4',
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};

const modalCancelButton = {
  width: '100%',
  marginTop: 10,
  padding: 13,
  border: '1px solid #E2E8F0',
  borderRadius: 12,
  background: '#FFFFFF',
  color: '#475569',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

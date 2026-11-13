import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './Login';
import Profile from './Profile';
import ProfileSetupPage from './ProfileSetupPage';
import ProfileCardPage from './ProfileCardPage';
import ScanPage from './ScanPage';
import MenuReviewPage from './MenuReviewPage';
import ResultPage from './ResultPage';
import HistoryPage from './HistoryPage';
import ChatPage from './ChatPage';
import ExplorePage from './ExplorePage'; // 식당 검색 목록 (SCR-12)
import RestaurantDetailPage from './RestaurantDetailPage'; // 식당 상세 (SCR-13)
import './App.css';
import GuestFeatureDialog from './GuestFeatureDialog';
import { SHOW_HISTORY_CHAT_TABS } from './featureFlags';

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
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

          {/* [SCR-04 신규 추가] 식당 찾기 입구 카드 */}
          <section style={exploreCard} onClick={() => navigate('/explore')}>
            <div style={exploreLeft}>
              <div style={exploreIconWrapper}>
                {/* 가게 아이콘 SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D5BB4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l1-5h16l1 5" />
                  <path d="M3 11c0 1.66 1.34 3 3 3s3-1.34 3-3c0 1.66 1.34 3 3 3s3-1.34 3-3c0 1.66 1.34 3 3 3s3-1.34 3-3" />
                  <path d="M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" />
                </svg>
              </div>
              <div>
                <h3 style={exploreTitle}>Explore restaurants</h3>
                <p style={exploreDesc}>Before you go, see which menus fit your profile.</p>
              </div>
            </div>
            <span style={exploreArrow}>&gt;</span>
          </section>

          {/* 프로필 태그 영역 */}
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
            <button type="button" className="dietary-card-entry" style={{ marginTop: 14 }} onClick={() => navigate('/profile/card', { state: { cardBackground: location } })}>Show my dietary card</button>
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
        <button onClick={() => navigate('/home')} style={navItem(currentPath === '/home')}>
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
              style={navItem(currentPath === '/history')}
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
              style={navItem(currentPath === '/chat')}
            >
              <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
              </svg>
              <span>Chat</span>
            </button>
          </>
        )}

        {/* Profile */}
        <button onClick={() => navigate('/profile')} style={navItem(currentPath === '/profile')}>
          <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </button>
      </nav>

      {showLoginModal && <GuestFeatureDialog feature={selectedFeature} onClose={() => setShowLoginModal(false)} />}
    </>
  );
}

function MemberFeature({ feature, children }) {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(null);
  useEffect(() => {
    let active = true;
    if (localStorage.getItem('isGuest') === 'true' || !supabase) {
      setAllowed(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (active) setAllowed(Boolean(data?.session?.access_token));
    }).catch(() => { if (active) setAllowed(false); });
    return () => { active = false; };
  }, []);
  if (allowed === null) return <p role="status" style={{ textAlign: 'center', padding: 24 }}>Checking authentication...</p>;
  if (allowed) return children;
  return <><Home /><GuestFeatureDialog feature={feature} onClose={() => navigate('/home', { replace: true })} /></>;
}

function AppRoutes() {
  const location = useLocation();
  const background = location.state?.cardBackground;

  const showingCard =
    location.pathname === '/profile/card' &&
    (
      ['/home', '/profile', '/result'].includes(background?.pathname) ||
      background?.pathname?.startsWith('/restaurant/')
    );

  return (
    <>
      {/* 원래 화면을 유지해 돌아왔을 때 분석이 다시 실행되지 않도록 함 */}
      <div hidden={showingCard}>
        <Routes location={showingCard ? background : location}>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/setup" element={<ProfileSetupPage />} />
          <Route path="/profile/card" element={<ProfileCardPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/menu-review" element={<MenuReviewPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/history" element={<MemberFeature feature="History"><HistoryPage /></MemberFeature>} />
          <Route path="/chat" element={<MemberFeature feature="Chat"><ChatPage /></MemberFeature>} />

          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
        </Routes>
      </div>

      {showingCard && <ProfileCardPage />}
    </>
  );
}


function App() {
  return <Router><AppRoutes /></Router>;
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
const mainContent = { flex: 1, padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 };
const scanCard = { background: '#FFFFFF', borderRadius: 24, padding: '24px 20px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const scanTitle = { fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', letterSpacing: '-0.3px' };
const scanDesc = { fontSize: 13, color: '#64748B', lineHeight: 1.45, margin: '0 0 20px 0', maxWidth: 280 };
const cameraCircleBtn = { width: 90, height: 90, borderRadius: '50%', background: '#1D5BB4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 10, boxShadow: '0 8px 20px rgba(29, 91, 180, 0.3)' };
const cameraIcon = { width: 40, height: 40, color: '#FFFFFF' };
const scanBtnText = { fontSize: 15, fontWeight: 700, color: '#1D5BB4' };

/* [신규 추가] 식당 찾기 카드 스타일 */
const exploreCard = {
  background: '#EFF6FF', // 연한 푸른빛 배경
  borderRadius: 20,
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '1px solid #DBEAFE', // 은은한 파란 테두리
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const exploreLeft = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const exploreIconWrapper = {
  width: 48,
  height: 48,
  borderRadius: 14,
  background: '#FFFFFF', // 아이콘 뒤 흰색 라운드 박스
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
  flexShrink: 0,
};

const exploreTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: '#1E293B',
  margin: '0 0 4px 0',
  letterSpacing: '-0.2px',
};

const exploreDesc = {
  fontSize: 13,
  color: '#64748B',
  lineHeight: 1.35,
  margin: 0,
};

const exploreArrow = {
  fontSize: 16,
  fontWeight: 700,
  color: '#1D5BB4', // 파란색 셰브론
  marginLeft: 8,
};
const filterSection = { display: 'flex', flexDirection: 'column', gap: 10 };
const filterHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' };
const filterTitle = { fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 };
const editLink = { fontSize: 13, fontWeight: 600, color: '#1D5BB4', textDecoration: 'none' };
const filterCard = { background: '#FFFFFF', borderRadius: 16, padding: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const filterCardDesc = { fontSize: 12, color: '#64748B', margin: '0 0 12px 0', lineHeight: 1.4 };
const tagRow = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const redTag = { padding: '6px 14px', borderRadius: 20, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 13, fontWeight: 600 };
const blueTag = { padding: '6px 14px', borderRadius: 20, border: '1px solid #1D5BB4', background: '#EFF6FF', color: '#1D5BB4', fontSize: 13, fontWeight: 600 };
const bottomNavStyle = { marginTop: 'auto', height: 64, background: '#FFFFFF', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 8px' };
const navItem = (isActive) => ({ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: isActive ? '#1D5BB4' : '#94A3B8', fontSize: 11, fontWeight: isActive ? 700 : 500, cursor: 'pointer', padding: '4px 8px' });
const navIcon = { width: 22, height: 22 };

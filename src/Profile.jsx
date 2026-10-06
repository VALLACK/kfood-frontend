import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

const Profile = () => {
  const navigate = useNavigate();

  // 선택 상태 (Supabase DB 연동)
  const [allergies, setAllergies] = useState([]);
  const [religion, setReligion] = useState('');
  const [diet, setDiet] = useState('');
  const [loading, setLoading] = useState(true);

  // 기존 프로필 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Failed to get user:', userError?.message);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('allergies, religious_diet, vegetarian_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to load profile:', profileError.message);
        setLoading(false);
        return;
      }

      if (profile) {
        setAllergies(profile.allergies || []);
        setReligion(profile.religious_diet || '');
        setDiet(profile.vegetarian_type || '');
      }
      setLoading(false);
    };

    loadProfile();
  }, []);

  // 시안 기준 옵션 리스트
const allergyOptions = [
    { value: 'peanuts', label: 'Peanuts' },
    { value: 'shellfish', label: 'Shellfish' },
    { value: 'eggs', label: 'Eggs' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'gluten', label: 'Gluten' },
    { value: 'soy', label: 'Soy' },
    { value: 'sesame', label: 'Sesame' },
    { value: 'tree_nuts', label: 'Tree Nuts' },
  ];

  const religionOptions = [
    { value: 'halal', label: 'Halal' },
    { value: 'kosher', label: 'Kosher' },
  ];

  const dietOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
  ];

  // 알레르기 복수 선택 토글
  const handleAllergyToggle = (e, value) => {
    e.currentTarget.blur();
    setAllergies((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  // 단일 선택 해제 지원 (이미 선택된 것을 누르면 해제)
  const handleReligionSelect = (e, value) => {
    e.currentTarget.blur();
    setReligion((prev) => (prev === value ? '' : value));
  };

  const handleDietSelect = (e, value) => {
    e.currentTarget.blur();
    setDiet((prev) => (prev === value ? '' : value));
  };

  // 프로필 저장
  const handleComplete = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('Failed to verify user session.');
      return;
    }

    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        allergies: allergies,
        religious_diet: religion,
        vegetarian_type: diet,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      alert('Failed to save profile.');
      return;
    }

    navigate('/home');
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      alert('Failed to log out.');
      return;
    }
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div style={pageContainer}>
        <div style={mobileCard}>
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <style>{`
        * {
          -webkit-tap-highlight-color: transparent !important;
        }
        div:focus, button:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      <div style={mobileCard}>
        {/* 상단 헤더 */}
        <header style={headerStyle}>
          <button onClick={() => navigate(-1)} style={backButton}>
            ‹
          </button>
          <h1 style={headerTitle}>Dietary Profile</h1>
        </header>

        <main style={mainContent}>
          {/* 1. ALLERGIES */}
          <section style={sectionStyle}>
            <h2 style={sectionTitle}>ALLERGIES</h2>
            <div style={cardBox}>
              <div style={chipGridStyle}>
                {allergyOptions.map((item) => {
                  const isSelected = allergies.includes(item.value);
                  return (
                    <div
                      key={item.value}
                      onClick={(e) => handleAllergyToggle(e, item.value)}
                      style={isSelected ? activeRedChipStyle : chipStyle}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 2. RELIGIOUS DIET */}
          <section style={sectionStyle}>
            <h2 style={sectionTitle}>RELIGIOUS DIET</h2>
            <div style={cardBox}>
              <div style={chipRowStyle}>
                {religionOptions.map((item) => {
                  const isSelected = religion === item.value;
                  return (
                    <div
                      key={item.value}
                      onClick={(e) => handleReligionSelect(e, item.value)}
                      style={isSelected ? activeBlueChipStyle : chipStyle}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. DIET PREFERENCE */}
          <section style={sectionStyle}>
            <h2 style={sectionTitle}>DIET PREFERENCE</h2>
            <div style={cardBox}>
              <div style={chipRowStyle}>
                {dietOptions.map((item) => {
                  const isSelected = diet === item.value;
                  return (
                    <div
                      key={item.value}
                      onClick={(e) => handleDietSelect(e, item.value)}
                      style={isSelected ? activeBlueChipStyle : chipStyle}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 저장 & 로그아웃 버튼 영역 */}
          <div style={actionButtonGroup}>
            <div onClick={handleComplete} style={saveBtnStyle}>
              Save Changes
            </div>
            <div onClick={handleLogout} style={logoutBtnStyle}>
              Log Out
            </div>
          </div>
        </main>

        {/* 하단 탭 네비게이션 */}
        <BottomNav />
      </div>
    </div>
  );
};

/* 하단 탭 네비게이션 컴포넌트 */
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

/* ==================== Inline Styles ==================== */

const pageContainer = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#333333',
  padding: '16px',
  boxSizing: 'border-box',
  userSelect: 'none',
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
  alignItems: 'center',
  padding: '44px 20px 16px',
  background: '#FFFFFF',
  gap: 12,
};

const backButton = {
  background: 'none',
  border: 'none',
  fontSize: 28,
  fontWeight: '300',
  color: '#0F172A',
  cursor: 'pointer',
  padding: 0,
  lineHeight: 1,
};

const headerTitle = {
  fontSize: 20,
  fontWeight: 800,
  color: '#0F172A',
  margin: 0,
  letterSpacing: '-0.3px',
};

const mainContent = {
  flex: 1,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  overflowY: 'auto',
};

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const sectionTitle = {
  fontSize: 12,
  fontWeight: 700,
  color: '#475569',
  margin: '0 0 4px 4px',
  letterSpacing: '0.5px',
};

const cardBox = {
  background: '#FFFFFF',
  borderRadius: 20,
  padding: '16px',
  border: '1px solid #F1F5F9',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const chipGridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const chipRowStyle = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const chipStyle = {
  padding: '10px 18px',
  borderRadius: 24,
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  color: '#475569',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
  outline: 'none',
};

/* 선택 시 스타일 */
const activeRedChipStyle = {
  padding: '10px 18px',
  borderRadius: 24,
  border: '2px solid #EF4444',
  background: '#FEF2F2',
  color: '#DC2626',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
  outline: 'none',
};

const activeBlueChipStyle = {
  padding: '10px 18px',
  borderRadius: 24,
  border: '2px solid #1D5BB4',
  background: '#EFF6FF',
  color: '#1D5BB4',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'none',
  outline: 'none',
};

const actionButtonGroup = {
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  paddingTop: 12,
};

const saveBtnStyle = {
  width: '100%',
  height: 52,
  marginTop: 'auto',
  background: '#1D5BB4',
  color: '#FFFFFF',
  borderRadius: 14,
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 14px rgba(29, 91, 180, 0.25)',
  transition: 'all 0.15s ease',
};

const logoutBtnStyle = {
  width: '100%',
  height: 44,
  background: '#F1F5F9',
  color: '#64748B',
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

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

export default Profile;
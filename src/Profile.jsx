import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

const Profile = () => {
  const navigate = useNavigate();

  // 언어 상태 (localStorage에서 읽어옴, 기본값 'en')
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  // 선택 상태 (알레르기, 종교, 식단)
  const [allergies, setAllergies] = useState([]);
  const [religion, setReligion] = useState('');
  const [diet, setDiet] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
  ];

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

  // 프로필 데이터 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const isGuest = localStorage.getItem('isGuest') === 'true';

        // 1. 게스트 유저 처리
        if (isGuest) {
          const savedLang = localStorage.getItem('appLanguage');
          if (savedLang) setSelectedLang(savedLang);

          const savedGuestData = localStorage.getItem('guestProfile');
          if (savedGuestData) {
            const parsed = JSON.parse(savedGuestData);
            setAllergies(parsed.allergies || []);
            setReligion(parsed.religious_diet || '');
            setDiet(parsed.vegetarian_type || '');
          }
          setLoading(false);
          return;
        }

        // 2. 로그인 유저 처리 (기존 안정된 컬럼들만 select)
        const savedLang = localStorage.getItem('appLanguage');
        if (savedLang) setSelectedLang(savedLang);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('allergies, religious_diet, vegetarian_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          setAllergies(profile.allergies || []);
          setReligion(profile.religious_diet || '');
          setDiet(profile.vegetarian_type || '');
        }
      } catch (err) {
        console.error('Load profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 언어 선택 핸들러
  const handleLanguageSelect = (code) => {
    setSelectedLang(code);
    localStorage.setItem('appLanguage', code);
  };

  const handleAllergyToggle = (e, value) => {
    e.currentTarget.blur();
    setAllergies((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

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
    setIsSaving(true);
    const isGuest = localStorage.getItem('isGuest') === 'true';

    // 선택 언어 저장
    localStorage.setItem('appLanguage', selectedLang);

    // 게스트 유저 저장
    if (isGuest) {
      const guestData = {
        allergies,
        religious_diet: religion,
        vegetarian_type: diet,
      };
      localStorage.setItem('guestProfile', JSON.stringify(guestData));
      setIsSaving(false);
      alert('Profile saved successfully!');
      navigate('/home');
      return;
    }

    // 로그인 유저 DB 저장 (기존 스키마 안전 유지)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsSaving(false);
        alert('Session expired. Please log in again.');
        return;
      }

      const { error } = await supabase.from('profiles').upsert(
        {
          user_id: user.id,
          allergies: allergies,
          religious_diet: religion,
          vegetarian_type: diet,
          preferred_language: selectedLang,
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('DB Upsert Error:', error.message);
        alert('Failed to save profile: ' + error.message);
        return;
      }

      alert('Profile saved successfully!');
      navigate('/home');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 로그아웃 처리 (언어 세팅 유지)
  const handleLogout = async () => {
    localStorage.removeItem('isGuest');
    localStorage.removeItem('guestProfile');
    // appLanguage는 지우지 않아 로그인 페이지나 재로그인 후에도 설정된 언어 유지
    await supabase.auth.signOut();
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
        * { -webkit-tap-highlight-color: transparent !important; }
        div:focus, button:focus { outline: none !important; box-shadow: none !important; }
      `}</style>

      <div style={mobileCard}>
        <header style={headerStyle}>
          <button onClick={() => navigate(-1)} style={backButton}>‹</button>
          <h1 style={headerTitle}>Dietary Profile</h1>
        </header>

        <main style={mainContent}>
          {/* 0. LANGUAGE SELECTION */}
          <section style={sectionStyle}>
            <h2 style={sectionTitle}>LANGUAGE</h2>
            <div style={cardBox}>
              <div style={langRowStyle}>
                {languages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      style={isSelected ? activeBlueLangChipStyle : langChipStyle}
                    >
                      {lang.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

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

          <div style={actionButtonGroup}>
            <div 
              onClick={isSaving ? null : handleComplete} 
              style={{
                ...saveBtnStyle,
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </div>
            <div onClick={handleLogout} style={logoutBtnStyle}>
              Log Out
            </div>
          </div>
        </main>

        <ProfileBottomNav />
      </div>
    </div>
  );
};

function ProfileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleProtectedNav = (targetPath, featureName) => {
    const isGuest = localStorage.getItem('isGuest') === 'true';

    if (isGuest) {
      alert(`${featureName} feature is available for signed-in users only.`);
      return;
    }

    navigate(targetPath);
  };

  return (
    <nav style={bottomNavStyle}>
      <button onClick={() => navigate('/home')} style={navItem(currentPath === '/home')}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </button>

      <button onClick={() => handleProtectedNav('/history', 'History')} style={navItem(currentPath === '/history')}>
        <svg style={navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 16 14" />
        </svg>
        <span>History</span>
      </button>

      <button onClick={() => handleProtectedNav('/chat', 'Chat')} style={navItem(currentPath === '/chat')}>
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

/* Inline Styles */
const pageContainer = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#333333', padding: '16px', boxSizing: 'border-box', userSelect: 'none' };
const mobileCard = { width: '100%', maxWidth: 390, minHeight: 780, background: '#F8FAFC', borderRadius: 36, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' };
const headerStyle = { display: 'flex', alignItems: 'center', padding: '44px 20px 16px', background: '#FFFFFF', gap: 12 };
const backButton = { background: 'none', border: 'none', fontSize: 28, fontWeight: '300', color: '#0F172A', cursor: 'pointer', padding: 0, lineHeight: 1 };
const headerTitle = { fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px' };
const mainContent = { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' };
const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 8 };
const sectionTitle = { fontSize: 12, fontWeight: 700, color: '#475569', margin: '0 0 4px 4px', letterSpacing: '0.5px' };
const cardBox = { background: '#FFFFFF', borderRadius: 20, padding: '16px', border: '1px solid #F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const chipGridStyle = { display: 'flex', flexWrap: 'wrap', gap: 10 };
const chipRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' };

const langRowStyle = { display: 'flex', gap: 6, flexWrap: 'nowrap', justifyContent: 'space-between' };
const langChipStyle = { flex: 1, padding: '8px 0', borderRadius: 24, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', outline: 'none', whiteSpace: 'nowrap' };
const activeBlueLangChipStyle = { flex: 1, padding: '8px 0', borderRadius: 24, border: '2px solid #1D5BB4', background: '#EFF6FF', color: '#1D5BB4', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', outline: 'none', whiteSpace: 'nowrap' };

const chipStyle = { padding: '10px 18px', borderRadius: 24, border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', outline: 'none' };
const activeRedChipStyle = { padding: '10px 18px', borderRadius: 24, border: '2px solid #EF4444', background: '#FEF2F2', color: '#DC2626', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', outline: 'none' };
const activeBlueChipStyle = { padding: '10px 18px', borderRadius: 24, border: '2px solid #1D5BB4', background: '#EFF6FF', color: '#1D5BB4', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', outline: 'none' };
const actionButtonGroup = { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 };
const saveBtnStyle = { width: '100%', height: 52, background: '#1D5BB4', color: '#FFFFFF', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(29, 91, 180, 0.25)' };
const logoutBtnStyle = { width: '100%', height: 44, background: '#F1F5F9', color: '#64748B', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const bottomNavStyle = { marginTop: 'auto', height: 64, background: '#FFFFFF', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 8px' };
const navItem = (isActive) => ({ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: isActive ? '#1D5BB4' : '#94A3B8', fontSize: 11, fontWeight: isActive ? 700 : 500, cursor: 'pointer', padding: '4px 8px' });
const navIcon = { width: 20, height: 20 };

export default Profile;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import gamcheonImg from './assets/gamcheon.jpg';
import Onboarding from './Onboarding';
import { needsProfileSetup } from './profileSetup';
import { ONBOARDING_COMPLETE_KEY, readOnboardingLanguage } from './onboardingStorage';

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem(ONBOARDING_COMPLETE_KEY) !== 'true');
  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    let active = true;
    if (!supabase) {
      setLoading(false);
      return;
    }
    let resolvingUser = null;
    const onSession = async (session) => {
      if (!active) return;
      if (session?.user) {
        if (resolvingUser === session.user.id) return;
        resolvingUser = session.user.id;
        setLoading(true);
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        localStorage.removeItem('isGuest');
        let showSetup = true;
        try { showSetup = await needsProfileSetup(supabase, session.user.id); }
        catch { /* A failed profile lookup must not imply a personalized profile exists. */ }
        if (active && resolvingUser === session.user.id) navigate(showSetup ? '/profile/setup' : '/home', { replace: true, state: showSetup ? { profileSetupUserId: session.user.id } : null });
      } else {
        resolvingUser = null;
        setLoading(false);
      }
    };
    supabase.auth.getSession().then(({ data }) => onSession(data?.session)).catch(() => {
      if (active) { setLoading(false); setAuthError('Could not check your session. Please try signing in again.'); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => { if (active) onSession(session); }, 0); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [navigate]);

  // 구글 로그인
  const handleLogin = async () => {
    if (googleLoading) return;
    finishOnboarding();
    setAuthError('');
    if (!supabase) {
      setAuthError('Google sign-in is unavailable. Please continue as a guest.');
      return;
    }
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    } catch {
      setAuthError('Google sign-in failed. Please try again or continue as a guest.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 새 게스트 프로필로 시작하되 온보딩에서 선택한 언어는 유지한다.
  const handleGuestLogin = () => {
    finishOnboarding();
    setGuestLoading(true);
    
    // 이전 게스트 프로필만 초기화하고 선택 언어는 이어받는다.
    localStorage.removeItem('guestProfile');
    localStorage.setItem('appLanguage', readOnboardingLanguage());
    
    localStorage.setItem('isGuest', 'true');
    navigate('/profile/setup');
  };

  if (loading) {
    return (
      <div style={loginContainer}>
        <div style={mobileCard}>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) return <Onboarding onGoogleSignIn={handleLogin} onGuestContinue={handleGuestLogin} />;

  return (
    <div style={loginContainer}>
      <div style={mobileCard}>
        <div style={cardContent}>
          <div style={iconWrapper}>
            <svg style={shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="8 12 11 14.5 16 9.5" />
            </svg>
          </div>

          <h1 style={title}>K-Food Safety Guide</h1>
          <p style={subtitle}>Eat safe, anywhere in Korea</p>

          {/* 일러스트 영역 */}
          <div style={illustrationCard}>
            <div style={illustrationInner}>
              <img 
                src={gamcheonImg}
                alt="Gamcheon Culture Village" 
                style={illustrationImg}
              />
            </div>
          </div>

          {/* 로그인 / 게스트 버튼 */}
          {authError && <p role="alert" style={{ color: '#B91C1C', fontSize: 13, marginBottom: 12 }}>{authError}</p>}
          <button onClick={handleLogin} style={googleButton} disabled={googleLoading}>
            <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span style={{ fontWeight: 600 }}>{googleLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          <button onClick={handleGuestLogin} style={guestLink} disabled={guestLoading}>
            {guestLoading ? 'Entering...' : 'Continue as Guest'}
          </button>
          <button type="button" className="login-intro-button" onClick={() => setShowOnboarding(true)}>View app introduction</button>
        </div>

        <p style={footerText}>Designed for Busan Gastronomy Tourism Support Center</p>
      </div>
    </div>
  );
}

export default Login;

/* Inline Styles */
const loginContainer = {
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
  background: '#FFFFFF',
  borderRadius: 36,
  padding: '32px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between', // 상하 중앙 밸런스 배치
  boxSizing: 'border-box',
  position: 'relative',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

/* 3. 전체 요소를 수직 중앙으로 잡아주는 메인 그룹 */
const cardContent = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: 'auto 0', // 수직 정중앙 정렬
};

const iconWrapper = {
  width: 64,
  height: 64,
  borderRadius: 20,
  background: '#1D5BB4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
};

const shieldIcon = { width: 34, height: 34, color: '#FFFFFF' };
const title = { fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.3px' };
const subtitle = { fontSize: 13, color: '#64748B', margin: '0 0 24px 0', fontWeight: 400 };

const illustrationCard = {
  width: '100%',
  height: 220,
  background: '#F1F5F9',
  borderRadius: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 24,
  overflow: 'hidden',
};

const illustrationInner = {
  width: 135,
  height: 185,
  background: '#FFFFFF',
  borderRadius: 8,
  padding: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const illustrationImg = { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 };

const googleButton = {
  width: '100%',
  height: 50,
  borderRadius: 25,
  border: '1px solid #E2E8F0',
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  cursor: 'pointer',
  outline: 'none',
  marginBottom: 12,
};

const guestLink = {
  background: 'none',
  border: 'none',
  color: '#1D5BB4',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
  outline: 'none',
  padding: '6px 12px',
};

const footerText = {
  fontSize: 11,
  color: '#94A3B8',
  textAlign: 'center',
  marginTop: 16,
};
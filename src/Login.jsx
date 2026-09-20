import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 현재 세션 바로 체크
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/home', { replace: true });
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // 2. 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        navigate('/home', { replace: true });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);


  const handleLogin = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) {
      console.error('Google Sign-in failed:', error.message);
    }
  };

  const handleGuestLogin = () => {
    navigate('/home');
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

  return (
    <div style={loginContainer}>
      <div style={mobileCard}>
        {/* 상단 블루 쉴드 아이콘 */}
        <div style={iconWrapper}>
          <svg style={shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 11 12 14 22 4" />
          </svg>
        </div>

        {/* 타이틀 & 서브타이틀 */}
        <h1 style={title}>K-Food Safety Guide</h1>
        <p style={subtitle}>Eat safe, anywhere in Korea</p>

        {/* 중앙 메인 일러스트 영역 */}
        <div style={illustrationCard}>
          <div style={illustrationInner}>
            <img 
              src="https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=600&q=80" 
              alt="Gamcheon Culture Village" 
              style={illustrationImg}
            />
            <div style={illustrationCaption}>
              GAMCHEON CULTURE VILLAGE
              <span style={{ display: 'block', fontSize: 8, color: '#9CA3AF', marginTop: 1 }}>BUSAN, SOUTH KOREA</span>
            </div>
          </div>
        </div>

        {/* 구글 로그인 버튼 */}
        <button onClick={handleLogin} style={googleButton}>
          {/* 구글 다색 로고 SVG */}
          <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span style={{ fontWeight: 600 }}>Sign in with Google</span>
        </button>

        {/* 게스트 진행 링크 */}
        <button onClick={handleGuestLogin} style={guestLink}>
          Continue as Guest
        </button>

        {/* 하단 지원 센터 정보 */}
        <p style={footerText}>
          Designed for Busan Gastronomy Tourism Support Center
        </p>
      </div>
    </div>
  );
}

export default Login;

/* ==================== Inline Styles ==================== */

const loginContainer = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#333333', // 디바이스 외각 다크 배경
  padding: '16px',
  boxSizing: 'border-box',
};

const mobileCard = {
  width: '100%',
  maxWidth: 390,
  minHeight: 740,
  background: '#FFFFFF',
  borderRadius: 36, // 모바일 프레임 곡률
  padding: '60px 28px 36px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxSizing: 'border-box',
  position: 'relative',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

const iconWrapper = {
  width: 72,
  height: 72,
  borderRadius: 22,
  background: '#1D5BB4', // 메인 블루 컬러
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20,
};

const shieldIcon = {
  width: 38,
  height: 38,
  color: '#FFFFFF',
};

const title = {
  fontSize: 22,
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 6px 0',
  letterSpacing: '-0.3px',
};

const subtitle = {
  fontSize: 13,
  color: '#6B7280',
  margin: '0 0 28px 0',
  fontWeight: 400,
};

const illustrationCard = {
  width: '100%',
  height: 200,
  background: '#F3F4F6',
  borderRadius: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 32,
  overflow: 'hidden',
};

const illustrationInner = {
  width: 130,
  height: 170,
  background: '#FFFFFF',
  borderRadius: 8,
  padding: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const illustrationImg = {
  width: '100%',
  height: 135,
  objectFit: 'cover',
  borderRadius: 4,
};

const illustrationCaption = {
  fontSize: 7,
  fontWeight: 700,
  color: '#4B5563',
  marginTop: 6,
  textAlign: 'center',
  letterSpacing: '0.3px',
};

const googleButton = {
  width: '100%',
  height: 50,
  borderRadius: 25, // 알약 모양 곡률
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
  color: '#1F2937',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  cursor: 'pointer',
  outline: 'none',
  marginBottom: 16,
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
  marginTop: 'auto',
  fontSize: 11,
  color: '#9CA3AF',
  textAlign: 'center',
  margin: 'auto 0 0 0',
};
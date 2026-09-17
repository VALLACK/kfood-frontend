import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('프로필 확인 실패:', profileError.message);
        return;
      }

      if (profile) {
        navigate('/home');
      } else {
        navigate('/profile');
      }
    };

    checkProfile();
  }, [navigate]);

  const handleLogin = async () => {
  if (!supabase) {
    console.error('Supabase 설정이 없습니다.');
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/',
      queryParams: {
      prompt: 'login',
    },
    },
  });

  if (error) {
    console.error('Google 로그인 실패:', error.message);
  }
};

  return (
    <div style={loginContainer}>
      <div style={loginBox}>
        {/* 이모지 배경 감싸기 */}
        <div style={logoWrapper}>
          <span style={logoEmoji}>🌶️</span>
        </div>

        <h1 style={title}>K-Food Safety Guide</h1>

        <p style={description}>
          한국 음식을 더 안전하게<br />
          즐겨보세요.
        </p>

        {/* 구글 SVG 아이콘 적용 및 hover 효과 */}
        <button 
          onClick={handleLogin} 
          style={googleButton}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8F9FA'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
        >
          <svg style={googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Google로 로그인
        </button>
      </div>
    </div>
  );
}

export default Login;

const loginContainer = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #FFF9F5 0%, #F5EBE6 100%)',
  padding: '20px',
  boxSizing: 'border-box',
};

const loginBox = {
  width: '100%',
  maxWidth: 400,
  padding: '48px 36px 36px',
  background: '#FFFFFF',
  borderRadius: 20,
  boxShadow: '0 10px 30px rgba(218, 70, 39, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
  textAlign: 'center',
  boxSizing: 'border-box',
};

const logoWrapper = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: '#FFF0ED',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
};

const logoEmoji = {
  fontSize: 36,
};

const title = {
  fontSize: 24,
  fontWeight: 800,
  color: '#111827',
  marginBottom: 10,
  letterSpacing: '-0.5px',
};

const description = {
  fontSize: 15,
  lineHeight: 1.6,
  color: '#4B5563',
  marginBottom: 32,
};

const googleButton = {
  width: '100%',
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: '#FFFFFF',
  border: '1px solid #DADCE0',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  color: '#3C4043',
  cursor: 'pointer',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  transition: 'all 0.2s ease',
};

// SVG에 맞춰 크기 조정
const googleIcon = {
  width: 18,
  height: 18,
};

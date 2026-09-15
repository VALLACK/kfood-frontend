import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // 화면 구성 단계에서는 버튼을 누르면 프로필로 이동
    navigate('/profile');
  };

  return (
    <div style={loginContainer}>
      <div style={loginBox}>
        <div style={logo}>🌶️</div>

        <h1 style={title}>K-Food Safety Guide</h1>

        <p style={description}>
          한국 음식을 더 안전하게<br />
          즐겨보세요.
        </p>

        <button onClick={handleLogin} style={googleButton}>
          <span style={googleIcon}>G</span>
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
  background: '#F8F5F0',
};

const loginBox = {
  width: '100%',
  maxWidth: 420,
  padding: '50px 40px',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  textAlign: 'center',
  boxSizing: 'border-box',
};

const logo = {
  fontSize: 42,
  marginBottom: 16,
};

const title = {
  fontSize: 28,
  fontWeight: 800,
  color: '#1A1A1A',
  marginBottom: 12,
};

const description = {
  fontSize: 15,
  lineHeight: 1.7,
  color: '#666',
  marginBottom: 36,
};

const googleButton = {
  width: '100%',
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  background: '#fff',
  border: '1px solid #DADCE0',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  color: '#3C4043',
  cursor: 'pointer',
};

const googleIcon = {
  fontSize: 20,
  fontWeight: 700,
};

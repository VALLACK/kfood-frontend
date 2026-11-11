
function LoginRequiredModal({ isOpen, selectedFeature, onClose, onLogin }) {
  if (!isOpen) return null;

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <button
          onClick={onClose}
          style={modalCloseButton}
          aria-label="Close"
        >
          ×
        </button>

        <div style={modalIcon}>
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 style={modalTitle}>Login Required</h2>

        <p style={modalDescription}>
          Sign in to access your {selectedFeature} features.
        </p>

        <button onClick={onLogin} style={modalLoginButton}>
          Log In
        </button>

        <button onClick={onClose} style={modalCancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default LoginRequiredModal;

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

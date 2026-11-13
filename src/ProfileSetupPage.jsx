import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { markProfileSetupSeen } from './profileSetup';
import './ProfileSetupPage.css';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const heading = useRef(null);
  const [userId, setUserId] = useState(location.state?.profileSetupUserId || null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    let active = true;
    if (localStorage.getItem('isGuest') !== 'true' && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (active) setUserId(data?.session?.user?.id || null);
      }).catch(() => {});
    }
    return () => { active = false; };
  }, []);
  const leave = (target) => {
    markProfileSetupSeen(userId);
    navigate(target, { replace: true });
  };
  return (
    <div className="profile-setup-shell">
      <div className="profile-setup-page">
        <main className="profile-setup-content">
          <p className="profile-setup-step">STEP 1 OF 2</p>
          <div className="profile-setup-shield" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7l-9-4Z" /><path d="m8 12 3 3 5-6" /></svg></div>
          <h1 ref={heading} tabIndex={-1}>Set up your dietary profile</h1>
          <p className="profile-setup-intro">We check every dish against your profile. It takes about 30 seconds.</p>
          <ul className="profile-setup-options">
            <li><span className="profile-setup-option-icon" aria-hidden="true">!</span><div><h2>Allergies</h2><p>Shellfish, peanuts, eggs, wheat and more</p></div></li>
            <li><span className="profile-setup-option-icon" aria-hidden="true">◇</span><div><h2>Religious diet</h2><p>Halal · Kosher</p></div></li>
            <li><span className="profile-setup-option-icon" aria-hidden="true">♧</span><div><h2>Diet preference</h2><p>Vegan · Vegetarian</p></div></li>
          </ul>
          <div className="profile-setup-warning"><strong>Without a profile, dishes may look SAFE</strong><p>Results are only personalized after you set your profile. SAFE does not guarantee that a dish is safe for you.</p></div>
          <div className="profile-setup-actions">
            <button className="profile-setup-primary" onClick={() => leave('/profile')}>Set up now</button>
            <button className="profile-setup-skip" onClick={() => leave('/home')}>Skip for now</button>
          </div>
        </main>
        <nav className="profile-setup-nav" aria-label="Main navigation">
          <Link to="/home" onClick={() => markProfileSetupSeen(userId)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z" /></svg>Home</Link>
          <Link to="/profile" onClick={() => markProfileSetupSeen(userId)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></svg>Profile</Link>
        </nav>
      </div>
    </div>
  );
}

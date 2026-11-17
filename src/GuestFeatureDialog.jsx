import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import './GuestFeatureDialog.css';

// SCR-17: native modal keeps focus inside and makes the underlying page inert.
export default function GuestFeatureDialog({ feature = 'History', onClose }) {
  const dialog = useRef(null);
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  const signIn = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      if (!supabase) throw new Error('unavailable');
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/`, queryParams: { prompt: 'select_account' } },
      });
      if (authError) throw authError;
      // Keep the guest profile and flag until the login callback confirms a session.
    } catch {
      setError('Google sign-in is unavailable. Please try again or continue as a guest.');
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <dialog ref={dialog} className="guest-feature-dialog" aria-labelledby="guest-feature-title" aria-describedby="guest-feature-description"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const buttons = [...dialog.current.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="guest-feature-handle" aria-hidden="true" />
      <div className="guest-feature-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></svg>
      </div>
      <h2 id="guest-feature-title">Sign in to use {feature}</h2>
      <p id="guest-feature-description">{feature === 'History'
        ? 'As a guest, your scans are not saved. Sign in with Google to keep your scan history and profile on any device.'
        : 'Chat is available for signed-in users. Sign in with Google to use Chat and keep your profile on any device.'}</p>
      {error && <p className="guest-feature-error" role="alert">{error}</p>}
      <button autoFocus className="guest-feature-primary" disabled={loading} onClick={signIn}>{loading ? 'Signing in…' : 'Sign in with Google'}</button>
      <button className="guest-feature-secondary" onClick={onClose}>Not now</button>
    </dialog>
  );
}

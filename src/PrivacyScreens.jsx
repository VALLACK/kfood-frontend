import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PrivacyScreens.css';

import { PRIVACY_VERSION } from './privacyVersion';

export function PrivacyDialog({ kind, busy = false, error = '', onClose, onAgree, onDecline, onDelete }) {
  const [checked, setChecked] = useState(false);
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab') return;
      const controls = [...panel.current.querySelectorAll('button:not(:disabled), a, input:not(:disabled)')];
      const first = controls[0], last = controls.at(-1);
      if (!controls.length) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [busy, onClose]);
  const guest = kind === 'guest';
  const deleting = kind === 'delete';
  return <div className="privacy-overlay"><section className={`privacy-dialog ${guest ? 'privacy-sheet' : ''}`} role="dialog" aria-modal="true" aria-labelledby="privacy-title" aria-describedby="privacy-description" ref={panel} tabIndex={-1}>
    <div className={`privacy-symbol ${deleting ? 'danger' : ''}`} aria-hidden="true">{deleting ? '×' : guest ? '▯' : '♙'}</div>
    <h2 id="privacy-title">{deleting ? 'Delete my info?' : guest ? 'Saved on this device only' : 'How we use your health and religious information'}</h2>
    <p id="privacy-description">{deleting ? 'Your dietary profile and scan history will be permanently deleted from our server. This cannot be undone.' : guest ? 'Your dietary profile stays in this browser. It is sent to our server when needed to check menus or create your staff card.' : 'Allergies and religious diets are sensitive information. We need your separate consent to save your profile.'}</p>
    {!guest && !deleting && <><dl className="privacy-summary"><dt>What we collect</dt><dd>Allergies and severity, religious diet (halal, kosher, hindu), vegetarian type</dd><dt>Why</dt><dd>To check each dish against your profile and make your staff card</dd><dt>How long</dt><dd>Until you delete your information or your account</dd><dt>Your choice</dt><dd>You can decline and save your profile on this device only. Previously saved server data is not deleted by declining.</dd></dl><label className="privacy-check"><input type="checkbox" checked={checked} disabled={busy} onChange={e => setChecked(e.target.checked)} />I agree to the collection and use of my sensitive information (required for server storage)</label></>}
    {guest && <p className="privacy-muted">Clearing browser data or logging out removes this local profile. Processing and retention details are in the privacy notice.</p>}
    <Link className="privacy-notice-link" to="/privacy">Read the full privacy notice ›</Link>
    {error && <p role="alert" className="privacy-error">{error}</p>}
    {deleting ? <><button className="privacy-primary danger" disabled={busy} onClick={onDelete}>{busy ? 'Deleting…' : 'Delete'}</button><button className="privacy-secondary" disabled={busy} onClick={onClose}>Cancel</button></> : guest ? <><button className="privacy-primary" disabled={busy} onClick={onAgree}>{busy ? 'Saving…' : 'Got it'}</button><button className="privacy-secondary" disabled={busy} onClick={onDecline}>Sign in to keep it across devices</button></> : <><button className="privacy-primary" disabled={!checked || busy} onClick={onAgree}>{busy ? 'Saving…' : 'Agree and save'}</button><button className="privacy-secondary" disabled={busy} onClick={onDecline}>Decline</button><button className="privacy-cancel" disabled={busy} onClick={onClose}>Cancel</button></>}
  </section></div>;
}

export default function PrivacyNotice() {
  const navigate = useNavigate();
  return <div className="privacy-page-shell"><main className="privacy-page"><header><button aria-label="Go back" onClick={() => navigate(-1)}>‹</button><h1>Privacy notice</h1></header><p className="privacy-muted">Notice version: {PRIVACY_VERSION}</p>
    <section><h2>What we collect</h2><ul><li>Google account information for signed-in users</li><li>Dietary profile: allergies and severity, religious diet and vegetarian type (separate consent for server storage)</li><li>Scan results: menu names and judgments</li></ul></section>
    <section><h2>Why we use it</h2><ul><li>To check dishes against your profile</li><li>To create your staff card and keep your scan history</li></ul></section>
    <section><h2>How long we keep it</h2><p>Saved profiles and scan history remain until deleted. Guest profiles are stored in this browser until you clear them or log out.</p></section>
    <section><h2>Where it is processed</h2><ul>
      <li>Profile and history storage, sign-in: Supabase (Seoul, Korea)</li>
      <li>Dish judging server: Render (Singapore). Your profile is checked by app rules here and is not stored.</li>
      <li>Menu reading, staff voice and chat questions: Groq AI (USA), with zero data retention (not stored)</li>
      <li>Web app: Vercel (Seoul, Korea)</li>
    </ul></section>
    <section><h2>Menu photos</h2><p>Sent to Groq AI only to read the menu. Not stored by the app or by Groq.</p></section>
    <section><h2>Your rights</h2><p>View and edit your profile at any time. Use Profile → Delete my info to request deletion and withdraw consent. Declining new consent does not remove existing server data.</p></section>
    <p className="privacy-muted">Contact details will be added after the team confirms the service contact.</p><Link to="/profile">Back to Profile</Link>
  </main></div>;
}

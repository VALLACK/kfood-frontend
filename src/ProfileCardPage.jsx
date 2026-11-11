import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';
import './ProfileCardPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const LANGUAGES = { en: 'English', ko: '한국어', ja: '日本語', zh: '中文' };

function validCard(card) {
  return typeof card?.empty === 'boolean' && ['staff', 'user'].every((side) => (
    typeof card[side]?.title === 'string' && typeof card[side]?.closing === 'string'
    && Array.isArray(card[side]?.lines) && card[side].lines.every((line) => typeof line === 'string')
  )) && (card.empty || card.staff.lines.length > 0);
}

export default function ProfileCardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const utteranceRef = useRef(null);
  const canSpeak = typeof window.speechSynthesis?.speak === 'function'
    && typeof window.SpeechSynthesisUtterance === 'function';

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      setCard(null);
      setNeedsLogin(false);
      try {
        let response;
        if (localStorage.getItem('isGuest') === 'true') {
          let saved;
          try { saved = JSON.parse(localStorage.getItem('guestProfile') || 'null'); }
          catch { throw new Error('Your saved guest profile could not be read. Please set up your dietary profile again.'); }
          response = await axios.post(`${API_URL}/profile/card/preview`, {
            allergies: saved?.allergies || [],
            religious_diet: saved?.religious_diet || null,
            vegetarian_type: saved?.vegetarian_type || null,
            preferred_language: localStorage.getItem('appLanguage') || 'en',
          }, { signal: controller.signal, timeout: 15000 });
        } else {
          const session = supabase ? (await supabase.auth.getSession()).data.session : null;
          if (!active) return;
          if (!session?.access_token) {
            setNeedsLogin(true);
            throw new Error('Please sign in again, or continue as a guest to create a dietary card.');
          }
          response = await axios.get(`${API_URL}/profile/card`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
            signal: controller.signal,
            timeout: 15000,
          });
        }
        if (!active) return;
        if (!validCard(response.data)) throw new Error('The server returned an incomplete dietary card. Please try again.');
        setCard(response.data);
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        if (err.response?.status === 401) {
          setNeedsLogin(true);
          setError('Your session has expired. Please sign in again.');
        } else {
          setError(err.isAxiosError
            ? 'Could not load your dietary card. Please check your connection and try again.'
            : err.message || 'Could not load your dietary card. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  useEffect(() => () => {
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      window.speechSynthesis?.cancel();
    }
  }, []);

  const readAloud = () => {
    if (!card || card.empty || !canSpeak) return;
    if (speaking) {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setSpeaking(false);
      return;
    }
    setSpeechError('');
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance([card.staff.title, ...card.staff.lines, card.staff.closing].join('. '));
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      const koreanVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.startsWith('ko'));
      if (koreanVoice) utterance.voice = koreanVoice;
      utterance.onend = () => { utteranceRef.current = null; setSpeaking(false); };
      utterance.onerror = (event) => {
        utteranceRef.current = null;
        setSpeaking(false);
        if (!['canceled', 'interrupted'].includes(event.error)) setSpeechError('Audio could not be played. Please show the Korean card to the staff instead.');
      };
      utteranceRef.current = utterance;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      utteranceRef.current = null;
      setSpeaking(false);
      setSpeechError('Audio could not be played. Please show the Korean card to the staff instead.');
    }
  };
  const goBack = () => location.state?.cardBackground
    ? navigate(-1)
    : navigate('/profile', { replace: true });

  return (
    <div className="staff-card-outer">
      <main className="staff-card-page">
        <header className="staff-card-header">
          <button type="button" className="staff-card-back" onClick={goBack} aria-label="Back">←</button>
          <div><h1>Staff Card</h1><p>Show this card to the staff</p></div>
        </header>
        <div className="staff-card-content">
          {loading && <p className="staff-card-status" role="status">Loading your dietary card...</p>}
          {error && (
            <div className="staff-card-error" role="alert">
              <p>{error}</p>
              {needsLogin ? <Link className="staff-card-primary" to="/">Sign in / Continue as Guest</Link>
                : <button className="staff-card-primary" type="button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>}
              <Link className="staff-card-edit" to="/profile">Edit dietary profile</Link>
            </div>
          )}
          {!loading && card?.empty && (
            <section className="staff-card-status">
              <h2>No dietary restrictions set</h2>
              <p>Add your allergies or dietary restrictions to create a card for the staff.</p>
              <Link className="staff-card-primary" to="/profile">Set up dietary profile</Link>
            </section>
          )}
          {!loading && card && !card.empty && (
            <>
              <section className="staff-card-korean" lang="ko" aria-label="Korean dietary card for staff">
                <span className="staff-card-label">직원분께 · For staff</span>
                <h2>{card.staff.title}</h2>
                <ul>{card.staff.lines.map((line, index) => <li key={index}>{line}</li>)}</ul>
                <p className="staff-card-closing">{card.staff.closing}</p>
              </section>
              <button type="button" className="staff-card-primary" disabled={!canSpeak} onClick={readAloud} aria-pressed={speaking}>
                {speaking ? 'Stop reading' : 'Read aloud in Korean'}
              </button>
              {!canSpeak && <p className="staff-card-help">Audio is unavailable in this browser. You can still show the Korean card.</p>}
              {speechError && <p className="staff-card-help" role="status">{speechError}</p>}
              <section className="staff-card-translation" lang={card.user.lang || 'en'} aria-label="Your language translation">
                <h2>IN YOUR LANGUAGE · {LANGUAGES[card.user.lang] || card.user.lang}</h2>
                <p><strong>{card.user.title}</strong></p>
                <ul>{card.user.lines.map((line, index) => <li key={index}>{line}</li>)}</ul>
                <p>{card.user.closing}</p>
              </section>
              <p className="staff-card-help">This card uses your saved dietary profile.</p>
              <Link className="staff-card-edit" to="/profile">Edit dietary profile</Link>
            </>
          )}
        </div>
        <nav className="staff-card-nav" aria-label="Main navigation">
          <Link to="/home">⌂<span>Home</span></Link>
          <Link to="/profile" aria-current="page">♙<span>Profile</span></Link>
        </nav>
      </main>
    </div>
  );
}

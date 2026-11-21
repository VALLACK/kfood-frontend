import { useEffect, useId, useRef, useState } from 'react';
import axios from 'axios';
import './StaffVoiceAnswer.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
let microphoneOwner = null;

export default function StaffVoiceAnswer({ item, question, disabled, onConfirm, onBusy }) {
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const recorder = useRef(null);
  const stream = useRef(null);
  const timers = useRef([]);
  const audio = useRef(null);
  const request = useRef(null);
  const transcribing = useRef(false);
  const generation = useRef(0);
  const active = useRef(true);
  const owner = useRef(Symbol('staff microphone'));
  const titleId = useId();
  const transcriptId = useId();

  const releaseMicrophone = () => {
    timers.current.forEach(id => { clearTimeout(id); clearInterval(id); });
    timers.current = [];
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    if (microphoneOwner === owner.current) microphoneOwner = null;
  };
  const discard = () => {
    generation.current += 1;
    request.current?.abort();
    transcribing.current = false;
    if (recorder.current) {
      recorder.current.onstop = null;
      recorder.current.ondataavailable = null;
      recorder.current.onerror = null;
      if (recorder.current.state !== 'inactive') recorder.current.stop();
      recorder.current = null;
    }
    releaseMicrophone();
    audio.current = null;
  };
  const cancel = () => {
    discard();
    setPhase('idle');
    setTranscript('');
    setError('');
  };
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; discard(); };
  }, []);
  useEffect(() => {
    onBusy(phase !== 'idle');
    const node = dialog.current;
    if (phase !== 'idle' && !node.open) node.showModal();
    if (phase === 'idle' && node.open) node.close();
  }, [phase, onBusy]);

  const transcribe = async (blob, version) => {
    if (!active.current || version !== generation.current || transcribing.current) return;
    transcribing.current = true;
    setPhase('transcribing');
    setError('');
    const controller = new AbortController();
    request.current = controller;
    const extension = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
    const form = new FormData();
    form.append('file', blob, `staff-answer.${extension}`);
    form.append('language', 'ko');
    try {
      const res = await axios.post(`${API_URL}/stt`, form, { signal: controller.signal, timeout: 60000 });
      if (!active.current || version !== generation.current) return;
      const text = typeof res.data?.text === 'string' ? res.data.text.trim() : '';
      if (!text) throw new Error('empty-transcript');
      setTranscript(text);
      setPhase('review');
    } catch (err) {
      if (!active.current || version !== generation.current || controller.signal.aborted) return;
      setPhase('error');
      setError(err.message === 'empty-transcript' ? 'No speech was recognized. Please record the answer again.'
        : err.response?.status === 429 ? 'Speech recognition has reached its request limit. Please try again later or use the answer buttons.'
        : err.code === 'ECONNABORTED' ? 'Speech recognition timed out. Please try again.'
        : 'Could not recognize the answer. Check your connection and try again.');
    } finally {
      if (version === generation.current) transcribing.current = false;
    }
  };

  const stop = () => {
    const current = recorder.current;
    if (current?.state !== 'recording') return;
    timers.current.forEach(id => { clearTimeout(id); clearInterval(id); });
    timers.current = [];
    setPhase('transcribing');
    current.stop();
    releaseMicrophone();
  };
  const start = async () => {
    if (disabled || microphoneOwner) {
      if (microphoneOwner) setError('Another answer is being recorded. Please finish it first.');
      return;
    }
    discard();
    const version = generation.current;
    setTranscript('');
    setError('');
    setSeconds(0);
    setPhase('requesting');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setPhase('error');
      setError('Voice recording is unavailable here. Use HTTPS or localhost in a supported browser, or use the answer buttons.');
      return;
    }
    microphoneOwner = owner.current;
    window.speechSynthesis?.cancel();
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active.current || version !== generation.current) { microphone.getTracks().forEach(track => track.stop()); return; }
      stream.current = microphone;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(type => MediaRecorder.isTypeSupported?.(type));
      const recording = new MediaRecorder(microphone, mime ? { mimeType: mime } : undefined);
      recorder.current = recording;
      const chunks = [];
      let size = 0;
      recording.ondataavailable = event => {
        if (!event.data.size) return;
        chunks.push(event.data);
        size += event.data.size;
        if (size > 24 * 1024 * 1024) {
          discard();
          setPhase('error');
          setError('The recording is too large. Please record a shorter answer.');
        }
      };
      recording.onerror = () => {
        if (!active.current || version !== generation.current) return;
        discard(); setPhase('error'); setError('Recording failed. Please record the answer again.');
      };
      recording.onstop = () => {
        releaseMicrophone();
        if (!active.current || version !== generation.current) return;
        const blob = new Blob(chunks, { type: recording.mimeType || chunks[0]?.type || 'audio/webm' });
        if (!blob.size) { setPhase('error'); setError('No audio was captured. Please record the answer again.'); return; }
        audio.current = blob;
        transcribe(blob, version);
      };
      recording.start(1000);
      setPhase('recording');
      timers.current = [setInterval(() => setSeconds(value => value + 1), 1000), setTimeout(stop, 30000)];
    } catch (err) {
      if (!active.current || version !== generation.current) return;
      discard();
      setPhase('error');
      setError(err.name === 'NotAllowedError' ? 'Microphone access was denied. Allow microphone access in your browser settings, or use the answer buttons.'
        : err.name === 'NotFoundError' ? 'No microphone was found. Connect a microphone or use the answer buttons.'
        : 'Could not start recording. Close other apps using the microphone and try again.');
    }
  };
  const apply = async () => {
    if (disabled || !transcript.trim()) return;
    const ok = await onConfirm(transcript.trim(), 'voice');
    if (active.current && ok) cancel();
    else if (active.current) setError('The answer was not confirmed. Your result is unchanged. Please check the answer and try again.');
  };

  return (
    <>
      <button type="button" className="staff-voice-start" disabled={disabled || phase !== 'idle'} onClick={start}>🎙 Answer by voice</button>
      <dialog ref={dialog} className="staff-voice-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!disabled) cancel(); }}>
        <header><button type="button" disabled={disabled} onClick={cancel} aria-label="Back to results">‹</button><div><h2 id={titleId}>Ask the Staff</h2><p>Show this screen to the staff</p></div></header>
        <div className="staff-voice-body">
          <section className="staff-voice-question"><span>Please show to staff · 직원분께 보여주세요</span><p>{item.menu}</p><h3 lang="ko">{question.ko}</h3><p>{question.translated}</p><button type="button" className="staff-voice-read" disabled={disabled || ['requesting', 'recording', 'transcribing'].includes(phase)} onClick={() => { if (!window.speechSynthesis) return; const speech = new SpeechSynthesisUtterance(question.ko); speech.lang = 'ko-KR'; speech.rate = .9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(speech); }}>Read aloud in Korean</button></section>
          {phase === 'recording' && <section className="staff-voice-recording">
            <div className="staff-voice-mic" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" /></svg></div><strong lang="ko">듣고 있어요… 말씀해 주세요</strong>
            <p>Listening to the staff · <span role="timer" aria-label="Recording duration">0:{String(seconds).padStart(2, '0')}</span></p>
            <div className="staff-voice-wave" aria-hidden="true">{[12,24,16,36,22,30,14,26,18].map((height,i) => <i key={i} style={{height,animationDelay:`${i*.08}s`}} />)}</div>
            <p>Recording stops after 30 seconds.</p>
          </section>}
          <p role="status" aria-live="polite">{phase === 'requesting' ? 'Waiting for microphone access…' : phase === 'transcribing' ? 'Recognizing the Korean answer…' : phase === 'review' ? 'Check the recognized answer before applying it.' : ''}</p>
          {error && <p role="alert" className="staff-voice-error">{error}</p>}
          {phase === 'review' && <div className="staff-voice-review"><label htmlFor={transcriptId}>Recognized answer · 한국어 답변</label><textarea id={transcriptId} lang="ko" value={transcript} disabled={disabled} onChange={event => setTranscript(event.target.value)} rows={3} /><p>Your result stays unchanged until you apply this answer.</p></div>}
          <div className="staff-voice-actions">
            {phase === 'recording' && <button type="button" className="staff-voice-primary" onClick={stop}>Done · 완료</button>}
            {phase === 'review' && <button type="button" className="staff-voice-primary" disabled={disabled || !transcript.trim()} onClick={apply}>{disabled ? 'Applying answer…' : 'Apply answer'}</button>}
            {phase === 'error' && audio.current && <button type="button" className="staff-voice-primary" onClick={() => transcribe(audio.current, generation.current)}>Retry recognition</button>}
            {['error','review'].includes(phase) && <button type="button" disabled={disabled} onClick={start}>Record again</button>}
            <button type="button" disabled={disabled} onClick={cancel}>Cancel · 취소</button>
          </div>
        </div>
      </dialog>
    </>
  );
}

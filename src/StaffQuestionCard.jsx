import { useState } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

function speakKo(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function StaffQuestionCard({ item, question, onUpdated }) {
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState('');
  const isVariant = question.kind === 'variant';

  const answer = async (value) => {
    setSending(true);
    setFailed('');
    try {
      const res = await axios.post(`${API_URL}/qna/confirm`, {
        menu_result: item,
        question: {
          kind: question.kind,
          ingredient: question.ingredient,
          tag: question.tag,
          options: question.options || [],
        },
        staff_answer: value,
        input_type: 'text',
      }, { headers: await authHeader(), timeout: 60000 });
      onUpdated(res.data.result);
    } catch {
      setFailed('Could not apply the answer. Please try again.');
      setSending(false);
    }
  };

  return (
    <div style={staffBox}>
      <div style={staffHint}>Show this to the staff</div>
      <div style={staffKo}>{question.ko}</div>
      <div style={staffTranslated}>{question.translated}</div>
      <button style={ttsBtn} onClick={() => speakKo(question.ko)}>🔊 Read aloud in Korean</button>
      <div style={answerRow}>
        {isVariant
          ? (question.options || []).map((opt) => (
              <button key={opt} disabled={sending} style={answerBtn('#1D5BB4')} onClick={() => answer(opt)}>{opt}</button>
            ))
          : (
            <>
              <button disabled={sending} style={answerBtn('#DC2626')} onClick={() => answer('예')}>Yes · 예</button>
              <button disabled={sending} style={answerBtn('#16A34A')} onClick={() => answer('아니요')}>No · 아니요</button>
            </>
          )}
      </div>
      {failed && <div style={staffError}>⚠️ {failed}</div>}
    </div>
  );
}

/* ==================== Inline Styles ==================== */

const staffBox = { background: '#FFFFFF', border: '1px dashed #E8A838', borderRadius: 12, padding: '12px 14px', marginTop: 8 };
const staffHint = { fontSize: 11, color: '#94A3B8', marginBottom: 6 };
const staffKo = { fontSize: 17, fontWeight: 800, color: '#0F172A', lineHeight: 1.4 };
const staffTranslated = { fontSize: 12, color: '#64748B', marginTop: 4 };
const ttsBtn = { marginTop: 10, border: '1px solid #1D5BB4', color: '#1D5BB4', background: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const answerRow = { display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' };
const answerBtn = (c) => ({ border: 'none', background: c, color: '#fff', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' });
const staffError = { marginTop: 8, fontSize: 12, color: '#DC2626' };

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ScanPage() {
  const [preview, setPreview]     = useState(null);
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const fileInputRef              = useRef(null);
  const navigate                  = useNavigate();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleScan = async () => {
    if (!file) { setError('메뉴판 사진을 먼저 선택해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API_URL}/ocr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // 결과를 ResultPage로 넘기기
      navigate('/result', { state: { ocrText: res.data.text, fileName: file.name } });
    } catch (err) {
      setError('백엔드 서버에 연결할 수 없어요. 서버가 켜져 있는지 확인하세요.\n' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <h2 style={titleStyle}>📸 메뉴판 스캔</h2>
      <p style={descStyle}>메뉴판 사진을 업로드하면 AI가 성분을 분석해드려요.</p>

      {/* 업로드 영역 */}
      <div
        style={{ ...uploadArea, ...(preview ? uploadAreaFilled : {}) }}
        onClick={() => fileInputRef.current.click()}
      >
        {preview ? (
          <img src={preview} alt="preview" style={previewImg} />
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>사진 선택 또는 촬영</div>
            <div style={{ fontSize: 12, color: '#888' }}>JPG, PNG 파일 지원 · 모바일에서는 카메라 직접 촬영 가능</div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 파일명 */}
      {file && (
        <div style={fileNameBadge}>
          ✅ {file.name}
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
            style={clearBtn}
          >✕</button>
        </div>
      )}

      {/* 에러 */}
      {error && <div style={errorBox}>{error}</div>}

      {/* 버튼들 */}
      <div style={btnRow}>
        <button
          onClick={handleScan}
          disabled={loading || !file}
          style={{ ...scanBtn, opacity: (!file || loading) ? 0.5 : 1 }}
        >
          {loading ? '분석 중...' : '🔍 성분 분석 시작'}
        </button>
        <button
          onClick={() => navigate('/result', { state: { demo: true } })}
          style={demoBtn}
        >
          데모로 보기
        </button>
      </div>

      <div style={tipBox}>
        💡 <strong>팁:</strong> 메뉴 이름이 잘 보이도록 정면에서 찍어주세요. 빛 반사가 없는 환경이 좋아요.
      </div>
    </div>
  );
}

const pageStyle   = { maxWidth: 480, margin: '0 auto', padding: '40px 20px' };
const titleStyle  = { fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#1A1A1A' };
const descStyle   = { fontSize: 14, color: '#666', marginBottom: 24 };
const uploadArea  = { border: '2px dashed #E0D8CC', borderRadius: 12, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: '#FDFBF8', transition: 'border-color .2s', marginBottom: 12 };
const uploadAreaFilled = { padding: 8, border: '2px solid #4A7C59' };
const previewImg  = { width: '100%', borderRadius: 8, maxHeight: 300, objectFit: 'contain' };
const fileNameBadge = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#E8F5E9', border: '1px solid #4A7C59', borderRadius: 4, padding: '6px 12px', fontSize: 13, color: '#2E6B43', marginBottom: 12 };
const clearBtn    = { background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 14 };
const errorBox    = { background: '#FFF0F0', border: '1px solid #B94A2C', borderRadius: 4, padding: '10px 14px', fontSize: 13, color: '#B94A2C', marginBottom: 12, whiteSpace: 'pre-line' };
const btnRow      = { display: 'flex', gap: 10, marginBottom: 16 };
const scanBtn     = { flex: 1, padding: '14px', background: '#B94A2C', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: 'pointer' };
const demoBtn     = { padding: '14px 18px', background: '#fff', color: '#666', border: '1px solid #E0D8CC', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const tipBox      = { background: '#FFF8F0', borderLeft: '3px solid #E8A838', padding: '12px 16px', borderRadius: '0 6px 6px 0', fontSize: 13, color: '#6b5000' };

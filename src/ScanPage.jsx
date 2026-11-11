import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { prepareMenuImage } from './prepareMenuImage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const galleryInputRef = useRef(null);
  const streamRef = useRef(null);
  const busyRef = useRef(false);
  const requestRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState(null);
  const [status, setStatus] = useState(''); // '' | 'preparing' | 'scanning' | 'error'
  const [error, setError] = useState('');
  const busy = status === 'preparing' || status === 'scanning';

  // 카메라 스트림 시작 (지원 안 되거나 거부되면 갤러리 선택으로 대체)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        setTorchSupported(!!caps.torch);
        setCameraReady(true);
      } catch {
        setCameraError('Camera is unavailable. Please choose a photo from your gallery.');
      }
    })();
    return () => {
      active = false;
      requestRef.current?.abort();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || !torchSupported) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {
      // 기기가 지원하지 않으면 조용히 무시
    }
  };

  const runScan = async (source, fileName) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('preparing');
    setError('');
    try {
      const prepared = await prepareMenuImage(source, fileName);
      if (controller.signal.aborted) return;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = URL.createObjectURL(prepared.blob);
      setCapturedPreview(previewUrlRef.current);
      setStatus('scanning');
      const formData = new FormData();
      formData.append('file', prepared.blob, prepared.fileName);
      const res = await axios.post(`${API_URL}/ocr`, formData, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      stopCamera();
      navigate('/menu-review', {
        replace: true,
        state: {
          menus: res.data.menus,
          ocrText: res.data.text,
          fileName,
          truncated: res.data.truncated === true,
        },
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setError(err.response?.status === 413
        ? 'This photo is too large for the server. Please photograph the menu in sections.'
        : err.isAxiosError
          ? 'Scan failed. Please check your connection and try again.'
          : err.message || 'This photo could not be prepared. Please choose another image.');
    } finally {
      busyRef.current = false;
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !cameraReady || busyRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context || !canvas.width || !canvas.height) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Encode only once, in the same preparation path used for file uploads.
    runScan(canvas, 'capture.jpg');
  };

  const handleGalleryFile = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || busyRef.current) return;
    runScan(file, file.name);
  };

  const handleClose = () => {
    requestRef.current?.abort();
    stopCamera();
    navigate('/home');
  };

  const handleRetry = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setCapturedPreview(null);
    setStatus('');
    setError('');
  };

  return (
    <div style={pageOuter}>
      <div style={mobileCard}>
        {/* 상단 바 */}
        <div style={topBar}>
          <button onClick={handleClose} style={iconBtn} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span style={topTitle}>K-Food Scan</span>
          <button
            onClick={toggleTorch}
            style={{ ...iconBtn, opacity: torchSupported ? 1 : 0.35 }}
            aria-label="Flash"
            disabled={!torchSupported}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              {!torchOn && <line x1="3" y1="21" x2="21" y2="3" stroke="#fff" strokeWidth="2" />}
            </svg>
          </button>
        </div>

        {/* 카메라/뷰파인더 영역 */}
        <div style={viewfinderWrap}>
          {!capturedPreview ? (
            <video ref={(video) => {
              videoRef.current = video;
              if (video && streamRef.current) video.srcObject = streamRef.current;
            }} autoPlay playsInline muted style={videoStyle} />
          ) : (
            <img src={capturedPreview} alt="Captured menu" style={videoStyle} />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div style={guideBox} />

          {cameraError && !capturedPreview && <div style={cameraErrorBox}>{cameraError}</div>}

          {busy && (
            <div style={scanningCard} role="status" aria-live="polite">
              <div style={spinner} />
              <div style={scanningText}>{status === 'preparing' ? 'Preparing photo...' : 'Reading menu items...'}</div>
            </div>
          )}

          {status === 'error' && (
            <div style={scanningCard}>
              <div style={{ ...scanningText, color: '#FCA5A5', whiteSpace: 'pre-line' }}>{error}</div>
              <button onClick={handleRetry} style={retryBtn}>Try again</button>
            </div>
          )}
        </div>

        {!status && <div style={hintText}>Point at the menu and tap to capture</div>}

        {/* 하단 컨트롤 */}
        <div style={bottomBar}>
          <button onClick={() => galleryInputRef.current?.click()} disabled={busy} style={sideIconBtn} aria-label="Choose from gallery">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          <button
            onClick={handleCapture}
            disabled={!cameraReady || busy}
            style={{ ...captureBtn, opacity: !cameraReady || busy ? 0.5 : 1 }}
            aria-label="Capture"
          >
            <span style={captureBtnInner} />
          </button>

          <button style={sideIconBtnDisabled} aria-label="Settings" disabled>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="9" cy="6" r="1.6" fill="#fff" stroke="none" />
              <circle cx="16" cy="12" r="1.6" fill="#fff" stroke="none" />
              <circle cx="10" cy="18" r="1.6" fill="#fff" stroke="none" />
            </svg>
          </button>
        </div>

        <div style={dragHandle} />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleGalleryFile}
          disabled={busy}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

/* ==================== Inline Styles ==================== */

const pageOuter = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '#333333',
  padding: '16px',
  boxSizing: 'border-box',
};

const mobileCard = {
  width: '100%',
  maxWidth: 390,
  minHeight: 780,
  background: '#0B0B0F',
  borderRadius: 36,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

const topBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 20px 12px',
};

const iconBtn = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const topTitle = {
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
};

const viewfinderWrap = {
  flex: 1,
  margin: '4px 20px 0',
  borderRadius: 20,
  background: '#000',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const videoStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const guideBox = {
  position: 'absolute',
  top: '8%',
  left: '6%',
  right: '6%',
  bottom: '8%',
  border: '2px dashed rgba(255,255,255,0.7)',
  borderRadius: 16,
  pointerEvents: 'none',
};

const cameraErrorBox = {
  position: 'absolute',
  left: 20,
  right: 20,
  textAlign: 'center',
  color: '#fff',
  fontSize: 13,
  lineHeight: 1.5,
  background: 'rgba(0,0,0,0.6)',
  borderRadius: 12,
  padding: '14px 16px',
};

const scanningCard = {
  position: 'absolute',
  left: 24,
  right: 24,
  background: 'rgba(17,17,20,0.9)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  padding: '16px 18px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
};

const spinner = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: '2.5px solid rgba(255,255,255,0.25)',
  borderTopColor: '#fff',
  animation: 'kfood-spin 0.8s linear infinite',
};

const scanningText = {
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};

const retryBtn = {
  marginTop: 4,
  padding: '8px 18px',
  borderRadius: 20,
  border: 'none',
  background: '#1D5BB4',
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const hintText = {
  textAlign: 'center',
  color: 'rgba(255,255,255,0.6)',
  fontSize: 13,
  padding: '14px 20px 0',
};

const bottomBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 32px 10px',
};

const sideIconBtn = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  border: 'none',
  background: 'rgba(255,255,255,0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const sideIconBtnDisabled = {
  ...sideIconBtn,
  opacity: 0.35,
  cursor: 'default',
};

const captureBtn = {
  width: 72,
  height: 72,
  borderRadius: '50%',
  border: '4px solid #fff',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const captureBtnInner = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: '#fff',
};

const dragHandle = {
  width: 120,
  height: 4,
  borderRadius: 2,
  background: 'rgba(255,255,255,0.3)',
  margin: '10px auto 16px',
};

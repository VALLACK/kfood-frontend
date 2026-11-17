import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ScanErrorScreen.css';

export default function ScanErrorScreen({ failure, header = 'Scan Menu', onRetry, onRetake, onChoosePhoto, onReviewMenus, onHome }) {
  const titleRef = useRef(null);
  const unreadable = failure.kind === 'unreadable';
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, []);
  return (
    <div className="scan-error-outer">
      <main className="scan-error-page">
        <header className="scan-error-header"><button type="button" onClick={onHome} aria-label="Back to home">←</button><span>{header}</span></header>
        <div className="scan-error-content">
          <div className={`scan-error-icon ${unreadable ? 'scan-error-icon-menu' : 'scan-error-icon-network'}`} aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8">
              {unreadable ? <><rect x="6" y="3" width="20" height="26" rx="4" /><path d="M10 9h3m3 0h6M10 15h3m3 0h6M10 21h3m3 0h6" /></>
                : <><path d="M4 12c7-6 17-6 24 0M8 17c5-4 11-4 16 0m-11 5c2-1 4-1 6 0M4 3l24 26" /><circle cx="16" cy="27" r="1" /></>}
            </svg>
          </div>
          <h1 ref={titleRef} tabIndex={-1}>{failure.title}</h1>
          <p className="scan-error-description">{failure.message}</p>
          {unreadable ? <section className="scan-error-tips" aria-label="Tips for a good scan">
            <h2>TIPS FOR A GOOD SCAN</h2>
            <ul><li>Fit the whole menu inside the frame</li><li>Use good light and avoid glare</li><li>Hold the phone steady, then tap</li><li>Photograph dense menus in smaller sections</li></ul>
          </section> : <section className="scan-error-notice" role="alert">
            <h2>No results are shown until the analysis succeeds</h2>
            <p>We never show example or old results as if they were real. Please do not order based on this screen.</p>
          </section>}
          <div className="scan-error-actions">
            <button type="button" className="scan-error-primary" onClick={unreadable ? onRetake : onRetry}>{unreadable ? 'Try again' : 'Retry'}</button>
            {unreadable && onChoosePhoto ? <button type="button" className="scan-error-secondary" onClick={onChoosePhoto}>Choose from gallery</button>
              : <button type="button" className="scan-error-secondary" onClick={onHome}>Back to home</button>}
            {onReviewMenus && <button type="button" className="scan-error-edit" onClick={onReviewMenus}>Review menu items</button>}
          </div>
        </div>
        <nav className="scan-error-nav" aria-label="Main navigation"><Link to="/home" aria-current="page">⌂<span>Home</span></Link><Link to="/profile">♙<span>Profile</span></Link></nav>
      </main>
    </div>
  );
}

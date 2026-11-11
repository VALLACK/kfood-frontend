import { useLocation, useNavigate } from 'react-router-dom';
import { createReviewRows, prepareAnalysisMenus } from './menuReview';
import './MenuReviewPage.css';

export default function MenuReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const scan = state || {};
  const rows = scan.reviewRows || createReviewRows(scan.menus);
  const menus = prepareAnalysisMenus(rows);
  const blankCount = rows.length - menus.length;

  // Store edits in this history entry so Back from results and refresh retain them.
  const updateRows = (reviewRows) => navigate('/menu-review', {
    replace: true,
    state: { ...scan, reviewRows },
  });
  const updateMenu = (id, changes) => updateRows(rows.map((row) => (
    row.id === id ? { ...row, menu: { ...row.menu, ...changes } } : row
  )));
  const addMenu = () => updateRows([
    ...rows,
    { id: Math.max(-1, ...rows.map((row) => row.id)) + 1, menu: { name: '', price: null, note: null } },
  ]);
  const analyze = (event) => {
    event.preventDefault();
    if (!menus.length) return;
    navigate('/result', {
      state: { ...scan, menus, menusReviewed: true, reviewRows: rows },
    });
  };

  return (
    <div className="menu-review-outer">
      <main className="menu-review">
        <header className="menu-review-header">
          <button type="button" className="menu-review-back" onClick={() => navigate('/scan', { replace: true })} aria-label="Back to camera">←</button>
          <div>
            <span className="menu-review-step">STEP 2 OF 3</span>
            <h1>Review menu items</h1>
          </div>
        </header>
        <form onSubmit={analyze}>
          <div className="menu-review-content">
            <p className="menu-review-intro">Check the names before analysis. Correct mistakes, remove items, or add missing dishes.</p>
            {scan.fileName && <p className="menu-review-filename">Photo: {scan.fileName}</p>}
            {scan.truncated && (
              <div className="menu-review-notice" role="status">Only some menu items were recognized. Add missing dishes or photograph the remaining items separately.</div>
            )}
            <div className="menu-review-list-heading">
              <h2>Menu items</h2>
              <span aria-live="polite">{menus.length} ready</span>
            </div>
            {!rows.length && (
              <div className="menu-review-empty" role="status">
                <strong>No menu items to review</strong>
                <p>Take another photo, choose a clearer image, or add menu items manually.</p>
              </div>
            )}
            <div className="menu-review-list">
              {rows.map(({ id, menu }, index) => (
                <section className="menu-review-item" key={id}>
                  <div className="menu-review-item-heading">
                    <label htmlFor={`menu-name-${id}`}>Item {index + 1}</label>
                    <button type="button" className="menu-review-remove" aria-label={`Remove item ${index + 1}`} onClick={() => updateRows(rows.filter((row) => row.id !== id))}>Remove</button>
                  </div>
                  <input id={`menu-name-${id}`} value={menu.name} onChange={(event) => updateMenu(id, { name: event.target.value })} placeholder="Enter a menu name" autoComplete="off" />
                  {menu.price && <p className="menu-review-price">Price on menu: {menu.price}</p>}
                  {menu.note != null && (
                    <details className="menu-review-note">
                      <summary>Menu board ingredient note</summary>
                      <label htmlFor={`menu-note-${id}`}>Keep this accurate if you change the dish.</label>
                      <textarea id={`menu-note-${id}`} value={menu.note} onChange={(event) => updateMenu(id, { note: event.target.value })} rows={2} />
                    </details>
                  )}
                </section>
              ))}
            </div>
            <button type="button" className="menu-review-add" onClick={addMenu}>+ Add menu item</button>
            {blankCount > 0 && <p className="menu-review-help" role="status">{blankCount} empty {blankCount === 1 ? 'item will' : 'items will'} be excluded from analysis.</p>}
          </div>
          <footer className="menu-review-actions">
            <button type="submit" className="menu-review-analyze" disabled={!menus.length}>Analyze Menu{menus.length > 0 ? ` (${menus.length})` : ''}</button>
            <button type="button" className="menu-review-retake" onClick={() => navigate('/scan', { replace: true })}>Retake / Choose another photo</button>
            <p>Only the menu items above will be analyzed.</p>
          </footer>
        </form>
      </main>
    </div>
  );
}

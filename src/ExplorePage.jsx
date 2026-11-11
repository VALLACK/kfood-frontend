import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ExplorePage() {
  const navigate = useNavigate();
  const isGuest = localStorage.getItem('isGuest') === 'true';

  // 검색 및 필터 상태
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('rating');
  const [onlyEdible, setOnlyEdible] = useState(false);

  // 식당 데이터 상태
  const [restaurants, setRestaurants] = useState([]);
  const [profileApplied, setProfileApplied] = useState(null);
  const [notice, setNotice] = useState(null);
  const [disclaimer, setDisclaimer] = useState('');
  const [ratingAttribution, setRatingAttribution] = useState('Google Maps');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 식당 데이터 Fetch
  const fetchRestaurants = async (
    searchQuery = query,
    currentSort = sort,
    isOnlyEdible = onlyEdible
  ) => {
    setLoading(true);
    setError('');

    try {
      const isGuest = localStorage.getItem('isGuest') === 'true';

      const headers = {
        'Content-Type': 'application/json',
      };

      const body = {
        q: searchQuery,
        sort: currentSort,
        only_edible: isOnlyEdible,
        limit: 10,
      };

      if (isGuest) {
        const savedGuestData = localStorage.getItem('guestProfile');
        if (savedGuestData) {
          body.profile = JSON.parse(savedGuestData);
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(`${API_URL}/restaurants/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Explore Restaurants Fail: ${response.status}`);
      }

      const data = await response.json();
      
      setDisclaimer(data.disclaimer || '');
      setRestaurants(data.restaurants || []);
      setProfileApplied(data.profile_applied ?? null);
      setNotice(data.notice || null);
      setRatingAttribution(data.rating_attribution || 'Google Maps');
      setTotal(data.total ?? data.restaurants?.length ?? 0);

    } catch (err) {
      console.error('Fetch restaurants error:', err);
      setError('Unable to load restaurants. Please try again.');
      setRestaurants([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(query, sort, onlyEdible);
  }, [sort, onlyEdible]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants(query, sort, onlyEdible);
  };

  const isOverTotal = total > restaurants.length && restaurants.length > 0;

  return (
    <div style={pageContainer}>
      <div style={mobileCard}>

        {/* 상단 헤더 */}
        <header style={headerStyle}>
          <button onClick={() => navigate('/home')} style={backBtn}>
            ‹
          </button>
          <h1 style={headerTitle}>Explore restaurants</h1>
        </header>

        <main style={mainContent}>

          {/* SCR-12-2 경고 배너 */}
          {profileApplied === false && (
            <div style={noticeCard}>
              <h3 style={noticeTitle}>Your profile is not set</h3>
              <p style={noticeDesc}>
                {notice || 'Please set your profile to check menu safety.'}
              </p>
              <button onClick={() => navigate('/profile')} style={noticeBtn}>
                Set my profile
              </button>
            </div>
          )}

          {/* 검색 입력창 */}
          <form onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
            <div style={searchBox}>
              <svg
                style={searchIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                type="text"
                placeholder="Restaurant, area or menu"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={searchInput}
              />
            </div>
          </form>

          {/* 프로필 설정 완료 시에만 필터 칩 노출 */}
          {profileApplied !== false && (
            <div style={chipRow}>
              <button
                onClick={() => setSort('rating')}
                style={sort === 'rating' ? activeChip : inactiveChip}
              >
                Google rating
              </button>

              <button
                onClick={() => setSort('edible')}
                style={sort === 'edible' ? activeChip : inactiveChip}
              >
                Most edible
              </button>

              <button
                onClick={() => setOnlyEdible(!onlyEdible)}
                style={onlyEdible ? activeChip : inactiveChip}
              >
                <span style={{ marginRight: 4 }}>{onlyEdible ? '☑' : '☐'}</span> Only edible
              </button>
            </div>
          )}

          {/* 식당 목록 */}
          {loading ? (
            <div style={statusText}>Loading restaurants...</div>
          ) : error ? (
            <div style={statusText}>{error}</div>
          ) : restaurants.length === 0 ? (
            <div style={emptyState}>
              <p style={emptyTitle}>No restaurants found</p>
              <p style={emptyDescription}>
                Try another restaurant name, area, or menu.
              </p>
            </div>
            
          ) : (
          <>
            {/* 식당 목록 제목 및 정렬 기준 */}
            {!isGuest && (
              <div>
                <h2 style={listTitle}>
                  Top {total} restaurants matching your dietary needs
                </h2>
                <p style={listSubtitle}>
                  Selected by edible menu availability, then ranked by Google rating.
                </p>
              </div>
            )}
            

            <div style={groupContainer}>
              {restaurants.map((item, index) => (
                <div
                  key={item.id || index}
                  onClick={() => navigate(`/restaurant/${item.id}`)}
                  style={{
                    ...itemRow,
                    borderBottom:
                      index === restaurants.length - 1 && !isOverTotal
                        ? 'none'
                        : '1px solid #F1F5F9',
                  }}
                >
                  {/* 식당 이름 및 평점 (실제 평점 연동 + 구글 정책 attribution 표시) */}
                  <div style={itemHeader}>
                    <h3 style={restaurantName}>{item.name}</h3>

                    {/* google.rating 숫자가 존재하면 실제 평점 표시, 없으면 No rating 표시 */}
                    {item.google?.rating != null ? (
                      <span style={ratingText}>
                        ★ {Number(item.google.rating).toFixed(1)}
                        <span style={{ fontSize: 9, color: '#94A3B8', marginLeft: 3, fontWeight: 400 }}>
                          ({ratingAttribution})
                        </span>
                      </span>
                    ) : (
                      <span style={{ ...ratingText, color: '#94A3B8' }}>
                        No rating
                        <span style={{ fontSize: 9, color: '#94A3B8', marginLeft: 3, fontWeight: 400 }}>
                          ({ratingAttribution})
                        </span>
                      </span>
                    )}
                  </div>

                  {/* 지역 및 카테고리 */}
                  <p style={restaurantMeta}>
                    {item.area || item.location} · {item.category}
                  </p>

                  {/* SCR-12-2 게스트/프로필 미설정 시 문구 처리 */}
                  {profileApplied === false ? (
                    <p style={guestNoticeText}>
                      Set your profile to check menus
                    </p>
                  ) : (
                    <>
                      {/* SAFE / CAUTION / WARNING 알약 배지 */}
                      <div style={badgeContainer}>
                        <div style={safeBadge}>
                          {item.summary?.safe ?? item.safe ?? 0}
                        </div>
                        <div style={cautionBadge}>
                          {item.summary?.caution ?? item.caution ?? 0}
                        </div>
                        <div style={warningBadge}>
                          {item.summary?.warning ?? item.warning ?? 0}
                        </div>
                      </div>

                      {/* 먹을 수 있는 메뉴 */}
                      {(item.summary?.safe_menus?.length > 0 || item.edible_menus?.length > 0) && (
                        <p style={edibleText}>
                          Can eat: {(item.summary?.safe_menus || item.edible_menus).join(', ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}

              

              {/* total > 20 안내 배너 */}
              {isOverTotal && (
                <div style={overTotalNotice}>
                  Showing {restaurants.length} of {total} restaurants.<br />
                  Narrow your search by keyword or area.
                </div>
              )}

        
            </div>
          </>
          )}

          {/* 하단 안내 문구 */}
          <div style={footerText}>
            {disclaimer && <div>{disclaimer}</div>}
          </div>


        </main>
      </div>
    </div>
  );
}

/* 스타일 정의 */
const pageContainer = {
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
  background: '#F8FAFC',
  borderRadius: 36,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
};

const headerStyle = {
  padding: '40px 20px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#F8FAFC',
};

const backBtn = {
  background: 'none',
  border: 'none',
  fontSize: 24,
  fontWeight: 300,
  color: '#0F172A',
  cursor: 'pointer',
  padding: 0,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
};

const headerTitle = {
  fontSize: 18,
  fontWeight: 800,
  color: '#0F172A',
  margin: 0,
  letterSpacing: '-0.3px',
  lineHeight: 1,
};

const mainContent = {
  flex: 1,
  padding: '0 16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  overflowY: 'auto',
};

const noticeCard = {
  background: '#FFF0F0',
  border: '1px solid #FFD6D6',
  borderRadius: 20,
  padding: '18px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const noticeTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: '#D93838',
  margin: 0,
};

const noticeDesc = {
  fontSize: 11,
  color: '#666666',
  lineHeight: 1.4,
  margin: 0,
};

const noticeBtn = {
  width: '100%',
  padding: '12px 0',
  background: '#1D5BB4',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: 4,
};

const searchBox = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const searchIcon = {
  position: 'absolute',
  left: 14,
  width: 16,
  height: 16,
};

const searchInput = {
  width: '100%',
  padding: '10px 14px 10px 38px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 20,
  fontSize: 12,
  color: '#0F172A',
  outline: 'none',
  boxSizing: 'border-box',
};

const chipRow = {
  display: 'flex',
  gap: 6,
  overflowX: 'auto',
  paddingBottom: 2,
};

const activeChip = {
  padding: '6px 14px',
  borderRadius: 18,
  background: '#1D5BB4',
  color: '#FFFFFF',
  border: '1px solid #1D5BB4',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

const inactiveChip = {
  padding: '6px 14px',
  borderRadius: 18,
  background: '#FFFFFF',
  color: '#64748B',
  border: '1px solid #E2E8F0',
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

const statusText = {
  textAlign: 'center',
  padding: '40px 0',
  fontSize: 12,
  color: '#94A3B8',
};

const emptyState = {
  background: '#FFFFFF',
  borderRadius: 20,
  border: '1px solid #F1F5F9',
  padding: '32px 16px',
  textAlign: 'center',
};

const emptyTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: '#334155',
  margin: '0 0 8px',
};

const emptyDescription = {
  fontSize: 11,
  color: '#94A3B8',
  margin: 0,
};

const groupContainer = {
  background: '#FFFFFF',
  borderRadius: 20,
  border: '1px solid #F1F5F9',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const itemRow = {
  padding: '14px 16px',
  cursor: 'pointer',
};

const itemHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 2,
};

const restaurantName = {
  fontSize: 14,
  fontWeight: 800,
  color: '#0F172A',
  margin: 0,
};

const ratingText = {
  fontSize: 12,
  fontWeight: 700,
  color: '#0F172A',
};

const restaurantMeta = {
  fontSize: 11,
  color: '#94A3B8',
  margin: '0 0 4px 0',
  textAlign: 'left',
};

const guestNoticeText = {
  fontSize: 11,
  color: '#94A3B8',
  margin: 0,
  textAlign: 'left',
};

const badgeContainer = {
  display: 'flex',
  gap: 6,
  marginBottom: 8,
};

const badgeBase = {
  minWidth: 28,
  height: 22,
  padding: '0 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const safeBadge = {
  ...badgeBase,
  background: '#E6F4EA',
  color: '#137333',
};

const cautionBadge = {
  ...badgeBase,
  background: '#FEF7E0',
  color: '#B06000',
};

const warningBadge = {
  ...badgeBase,
  background: '#FCE8E6',
  color: '#C5221F',
};

const edibleText = {
  fontSize: 11,
  color: '#94A3B8',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'left',
};

const overTotalNotice = {
  padding: '16px',
  borderTop: '1px solid #F1F5F9',
  textAlign: 'center',
  fontSize: 11,
  color: '#64748B',
  lineHeight: 1.4,
  fontWeight: 500,
};

const footerText = {
  textAlign: 'center',
  fontSize: 10,
  color: '#94A3B8',
  padding: '12px 0 16px',
  lineHeight: 1.3,
};
const listTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: '#0F172A',
  margin: '4px 0 4px',
};

const listSubtitle = {
  fontSize: 10,
  color: '#94A3B8',
  margin: 0,
  lineHeight: 1.4,
};
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import ResultCard from './components/ResultCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 백엔드 상세 데이터 조회 (POST /restaurants/{id})
  const fetchDetail = async () => {
    setLoading(true);
    try {
      const isGuest = localStorage.getItem('isGuest') === 'true';
      const headers = { 'Content-Type': 'application/json' };
      const body = {};

      if (isGuest) {
        const savedGuestData = localStorage.getItem('guestProfile');
        const guestProfile = savedGuestData
          ? JSON.parse(savedGuestData)
          : {};

        body.profile = {
          ...guestProfile,
          preferred_language:
            localStorage.getItem('appLanguage') ||
            guestProfile.preferred_language ||
            'en',
        };
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch(`${API_URL}/restaurants/${id}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch restaurant detail');
      }

      const result = await response.json();
      console.log('Google 평점 데이터:', {
        google: result.google,
        rating: result.rating,
        rating_attribution: result.rating_attribution,
      });
      setData(result);
    } catch (err) {
      console.error('Fetch detail error:', err);
      setError(err.message || 'Unable to load restaurant detail.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleUpdated = (index, updatedItem) => {
    setData((prevData) => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        results: prevData.results.map((item, i) =>
          i === index ? updatedItem : item
        ),
      };
    });
  };



  if (loading) {
    return (
      <div style={pageContainer}>
        <div style={mobileCard}>
          <div style={statusText}>Loading restaurant detail...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={pageContainer}>
        <div style={mobileCard}>
          <div style={errorContainer}>
            <div style={statusText}>{error || 'Restaurant not found.'}</div>
            <button onClick={() => navigate(-1)} style={errorBackBtn}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentResults = data.results || [];

  const safeCount = currentResults.filter(
    (item) => item.risk?.level === 'SAFE'
  ).length;

  const cautionCount = currentResults.filter(
    (item) => item.risk?.level === 'CAUTION'
  ).length;

  const warningCount = currentResults.filter(
    (item) => item.risk?.level === 'WARNING'
  ).length;

  return (
    <div style={pageContainer}>
      <div style={mobileCard}>
        {/* 상단 헤더 */}
        <header style={headerStyle}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div style={headerTextGroup}>
            <h1 style={headerTitle}>{data.name}</h1>
            <p style={headerSubTitle}>{data.area || data.location} · {data.category}</p>
          </div>
        </header>

        {/* 메인 스크롤 콘텐츠 */}
        <main style={mainContent}>
          {/* 1. 구글 지도 & 뱃지 요약 카드 */}
          <div style={summaryCard}>
            <div style={googleRatingRow}>
              {data.google?.rating != null ? (
                <span>
                  ★ {Number(data.google.rating).toFixed(1)}
                </span>
              ) : (
                <span style={{ color: '#94A3B8' }}>
                  No rating
                </span>
              )}

              <span style={{ color: '#94A3B8', fontSize: 11 }}>
                (Google Maps)
              </span>
            </div>

            {data.maps_url && (
              <a href={data.maps_url} target="_blank" rel="noreferrer" style={mapsLink}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D5BB4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Open in Google Maps
              </a>
            )}

            <div style={summaryBadgeRow}>
              <span style={safePill}>SAFE {safeCount}</span>
              <span style={cautionPill}>CAUTION {cautionCount}</span>
              <span style={warningPill}>WARNING {warningCount}</span>
            </div>
          </div>

          {/* 2. 가게 도착 시 직원에게 보여주는 카드 이동 버튼 */}
          <button
            onClick={() =>
              navigate('/profile/card', {
                state: { cardBackground: location },
              })
            }
            style={staffCardBtn}
          >
            Show my card to the staff
          </button>

          {/* 3. MENUS 서브헤더 */}
          <div style={menuSectionHeader}>
            MENUS
          </div>

          
          {/* 4. 메뉴 리스트 카드 */}
          <div style={menuGroupContainer}>
            {data.results?.map((item, index) => (
              <div
                key={`${item.menu}-${index}`}
                style={{
                  padding: '8px 12px',
                  borderBottom:
                    index === data.results.length - 1
                      ? 'none'
                      : '1px solid #F1F5F9',
                }}
              >
                

                <ResultCard
                  item={item}
                  onUpdated={(updated) => handleUpdated(index, updated)}
                  showAnalysis={false}
                />
              </div>
            ))}

            {(!data.results || data.results.length === 0) && (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>
                No menu information available.
              </div>
            )}
          </div>


          {/* 하단 면책 조항 */}
          {data.disclaimer && (
            <div style={footerDisclaimer}>
              {data.disclaimer}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* 🎨 스타일 정의 */
const pageContainer = { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#333333', padding: '16px', boxSizing: 'border-box' };
const mobileCard = { width: '100%', maxWidth: 390, minHeight: 780, background: '#F8FAFC', borderRadius: 36, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' };

const headerStyle = { padding: '24px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC' };
const backBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 };
const headerTextGroup = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' };
const headerTitle = { fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.3px', textAlign: 'left' };
const headerSubTitle = { fontSize: 11, color: '#94A3B8', margin: '2px 0 0 0', textAlign: 'left' };

const mainContent = { flex: 1, padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' };
const statusText = { padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 12 };

const errorContainer = { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20 };
const errorBackBtn = { padding: '10px 20px', background: '#1D5BB4', color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 12 };

const summaryCard = { background: '#FFFFFF', borderRadius: 20, padding: '16px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const googleRatingRow = { fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 };
const mapsLink = { fontSize: 12, color: '#1D5BB4', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center' };

const summaryBadgeRow = { display: 'flex', gap: 6, marginTop: 4 };
const pillBase = { padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 800 };
const safePill = { ...pillBase, background: '#E6F4EA', color: '#137333' };
const cautionPill = { ...pillBase, background: '#FEF7E0', color: '#B06000' };
const warningPill = { ...pillBase, background: '#FCE8E6', color: '#C5221F' };

const staffCardBtn = { width: '100%', padding: '14px 0', background: '#FFFFFF', border: '1.5px solid #1D5BB4', color: '#1D5BB4', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer' };

const menuSectionHeader = { 
  fontSize: 11, 
  fontWeight: 800, 
  color: '#64748B', 
  letterSpacing: '0.5px', 
  textAlign: 'center', 
  margin: '6px 0 2px 0',
  width: '100%' 
};

const menuGroupContainer = { background: '#FFFFFF', borderRadius: 20, border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const menuItemRow = { padding: '16px', display: 'flex', flexDirection: 'column', gap: 4 };

const menuTitleRow = { display: 'flex', alignItems: 'center', gap: 8 };
const tagBase = { padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 800 };
const safeTag = { ...tagBase, background: '#E6F4EA', color: '#137333' };
const cautionTag = { ...tagBase, background: '#FEF7E0', color: '#B06000' };
const warningTag = { ...tagBase, background: '#FCE8E6', color: '#C5221F' };

const menuTitle = { fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 };
const menuSubText = { fontSize: 11, color: '#64748B', margin: '2px 0 4px 0', textAlign: 'left'};
const descText = { fontSize: 11, color: '#94A3B8', margin: 0,textAlign: 'left' };
const cautionDescText = { fontSize: 11, fontWeight: 700, color: '#EA580C', margin: 0, lineHeight: 1.35,textAlign: 'left' };

const questionCard = { background: '#FFFFFF', border: '1px solid #FED7AA', borderRadius: 16, padding: '14px', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 2px 6px rgba(234, 88, 12, 0.05)' };
const questionSubTitle = { fontSize: 10, color: '#94A3B8' };
const questionKoTitle = { fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 };
const questionEnTitle = { fontSize: 11, color: '#64748B', margin: 0 };

const ttsBtn = { padding: '8px 12px', background: '#FFFFFF', border: '1.5px solid #1D5BB4', borderRadius: 18, color: '#1D5BB4', fontSize: 11, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', marginTop: 4, display: 'flex', alignItems: 'center' };

const answerBtnRow = { display: 'flex', gap: 8, marginTop: 6 };
const yesBtn = { flex: 1, padding: '10px 0', background: '#C5221F', color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const noBtn = { flex: 1, padding: '10px 0', background: '#15803D', color: '#FFFFFF', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' };

const footerDisclaimer = { textAlign: 'center', fontSize: 10, color: '#94A3B8', padding: '12px 0 16px', lineHeight: 1.3 };
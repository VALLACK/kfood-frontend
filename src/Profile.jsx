import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const Profile = () => {
  const navigate = useNavigate();

  // 선택된 알레르기
  const [allergies, setAllergies] = useState([]);

  // 종교
  const [religion, setReligion] = useState(null);

  // 식단
  const [diet, setDiet] = useState(null);

  // 기존 프로필 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      // 현재 로그인한 사용자 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('로그인 사용자 확인 실패:', userError?.message);
        return;
      }

      // profiles 테이블에서 현재 사용자 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('allergies, religious_diet, vegetarian_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('프로필 불러오기 실패:', profileError.message);
        return;
      }

      // 프로필이 있으면 화면에 표시
      if (profile) {
        setAllergies(profile.allergies || []);
        setReligion(profile.religious_diet || '');
        setDiet(profile.vegetarian_type || '');
      }
    };

    loadProfile();
  }, []);

  const allergyOptions = ['땅콩', '갑각류', '유제품', '밀', '달걀', '견과류', '대두', '아황산류'];

  const religionOptions = [
    { value: '', label: '해당 없음' },
    { value: 'halal', label: '할랄 (Halal)' },
    { value: 'kosher', label: '코셔 (Kosher)' },
  ];

  const dietOptions = [
    { value: '', label: '해당 없음' },
    { value: 'vegan', label: '비건 (Vegan)' },
    { value: 'vegetarian', label: '베지테리언 (Vegetarian)' },
  ];
  
  // 알레르기 선택 / 해제
  const handleAllergyToggle = (option) => {
    setAllergies((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  // 설정 완료
  const handleComplete = async () => {
    // 현재 로그인한 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }

    // 프로필 정보 저장
    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        allergies: allergies,
        religious_diet: religion,
        vegetarian_type: diet,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      alert('프로필 저장에 실패했습니다.');
      return;
    }

    // 저장 성공 → 홈
    navigate('/home');
  };

  return (
    <div style={pageStyle}>
      <div style={profileBox}>
        {/* 상단 타이틀 영역 */}
        <div style={headerStyle}>
          <div style={iconBadge}>🛡️</div>
          <h1 style={titleStyle}>맞춤 식단 안전 설정</h1>
          <p style={descriptionStyle}>
            섭취하기 주의해야 하는 식품 정보를 선택해주세요.<br />
            맞춤형 안전 가이드를 제공해 드립니다.
          </p>
        </div>

        {/* 1. 알레르기 */}
        <section style={sectionStyle}>
          <div style={sectionHeader}>
            <span style={sectionTitleStyle}>알레르기</span>
            <span style={badgeStyle}>복수 선택 가능</span>
          </div>

          <div style={chipGridStyle}>
            {allergyOptions.map((option) => {
              const isSelected = allergies.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleAllergyToggle(option)}
                  style={{
                    ...chipStyle,
                    ...(isSelected ? activeChipStyle : {}),
                  }}
                >
                  {isSelected && <span style={{ marginRight: 4 }}>✓</span>}
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. 종교적 식단 */}
        <section style={sectionStyle}>
          <span style={sectionTitleStyle}>종교적 식단 제한</span>
          <div style={optionGroupStyle}>
            {religionOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setReligion(item.value)}
                style={{
                  ...optionBtnStyle,
                  ...(religion === item.value ? activeOptionBtnStyle : {}),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* 3. 채식/식단 유형 */}
        <section style={sectionStyle}>
          <span style={sectionTitleStyle}>채식 및 선호 식단</span>
          <div style={optionGroupStyle}>
            {dietOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setDiet(item.value)}
                style={{
                  ...optionBtnStyle,
                  ...(diet === item.value ? activeOptionBtnStyle : {}),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* 완료 버튼 */}
        <button onClick={handleComplete} style={saveBtnStyle}>
          설정 완료 →
        </button>
      </div>
    </div>
  );
};

/* ==================== 스타일 ==================== */

const pageStyle = {
  minHeight: '100vh',
  background: '#F9FAFB',
  padding: '40px 16px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxSizing: 'border-box',
};

const profileBox = {
  width: '100%',
  maxWidth: 480,
  background: '#FFFFFF',
  borderRadius: 20,
  padding: '40px 28px',
  boxSizing: 'border-box',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: 32,
};

const iconBadge = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: '#FEF2F2',
  fontSize: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
};

const titleStyle = {
  fontSize: 22,
  fontWeight: 800,
  color: '#111827',
  margin: '0 0 8px 0',
  letterSpacing: '-0.5px',
};

const descriptionStyle = {
  fontSize: 14,
  lineHeight: 1.5,
  color: '#6B7280',
  margin: 0,
};

const sectionStyle = {
  marginBottom: 28,
};

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const sectionTitleStyle = {
  display: 'block',
  fontSize: 15,
  fontWeight: 700,
  color: '#374151',
  marginBottom: 10,
};

const badgeStyle = {
  fontSize: 11,
  color: '#9CA3AF',
  fontWeight: 500,
};

/* 알레르기 태그(칩) 스타일 */
const chipGridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const chipStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  padding: '10px 16px',
  borderRadius: 20,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
  color: '#4B5563',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
  boxShadow: 'none',
};

const activeChipStyle = {
  background: '#FEF2F2',
  border: '1px solid #DC2626',
  color: '#DC2626',
  fontWeight: 700,
  outline: 'none',
  boxShadow: 'none',
};

/* 옵션 버튼 그룹 스타일 */
const optionGroupStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
};

const optionBtnStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',

  padding: '12px 8px',
  borderRadius: 10,

  border: '1px solid #E5E7EB',
  outline: 'none',
  boxShadow: 'none',

  background: '#FFFFFF',
  color: '#6B7280',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'center',

  WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.2s ease',
};

const activeOptionBtnStyle = {
  background: '#F3F4F6',
  border: '1px solid #D1D5DB',
  color: '#111827',
  fontWeight: 700,
  outline: 'none',
  boxShadow: 'none',
};

/* 완료 버튼 스타일 */
const saveBtnStyle = {
  width: '100%',
  height: 52,
  marginTop: 12,
  background: '#DC2626',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
  transition: 'background-color 0.2s ease',
};

export default Profile;
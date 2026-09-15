import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  // 선택된 알레르기
  const [allergies, setAllergies] = useState([]);

  // 종교
  const [religion, setReligion] = useState('');

  // 식단
  const [diet, setDiet] = useState('');

  const allergyOptions = [
    '땅콩',
    '갑각류',
    '유제품',
    '밀',
    '달걀',
    '견과류'
  ];

  // 알레르기 선택 / 해제
  const handleAllergyChange = (option) => {
    setAllergies((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  // 설정 완료
  const handleComplete = () => {
    // 지금은 UI 구현 단계이므로 홈 화면으로 이동만 함
    navigate('/home');
  };

  return (
    <div style={pageStyle}>

      <div style={profileBox}>

        {/* 제목 */}
        <div style={iconStyle}>👤</div>

        <h1 style={titleStyle}>
          음식 안전 설정
        </h1>

        <p style={descriptionStyle}>
          나에게 맞는 음식 정보를 제공하기 위해<br />
          음식 관련 정보를 설정해주세요.
        </p>


        {/* 1. 알레르기 */}
        <section style={sectionStyle}>

          <h3 style={sectionTitleStyle}>
            알레르기
          </h3>

          <p style={sectionDescriptionStyle}>
            해당하는 알레르기를 모두 선택해주세요.
          </p>

          <div style={gridStyle}>
            {allergyOptions.map((option) => (
              <label
                key={option}
                style={{
                  ...allergyItemStyle,
                  backgroundColor: allergies.includes(option)
                    ? '#FDF0EC'
                    : '#fff',
                  borderColor: allergies.includes(option)
                    ? '#B94A2C'
                    : '#E0D8CC',
                }}
              >
                <input
                  type="checkbox"
                  checked={allergies.includes(option)}
                  onChange={() => handleAllergyChange(option)}
                />

                <span>{option}</span>
              </label>
            ))}
          </div>

        </section>


        {/* 2. 종교 */}
        <section style={sectionStyle}>

          <h3 style={sectionTitleStyle}>
            종교적 식단
          </h3>

          <p style={sectionDescriptionStyle}>
            음식 선택에 영향을 주는 종교적 식단이 있다면 선택해주세요.
          </p>

          <select
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
            style={selectStyle}
          >
            <option value="">해당 없음</option>
            <option value="halal">할랄 (Halal)</option>
            <option value="kosher">코셔 (Kosher)</option>
          </select>

        </section>


        {/* 3. 식단 */}
        <section style={sectionStyle}>

          <h3 style={sectionTitleStyle}>
            식단
          </h3>

          <p style={sectionDescriptionStyle}>
            평소 선호하는 식단을 선택해주세요.
          </p>

          <select
            value={diet}
            onChange={(e) => setDiet(e.target.value)}
            style={selectStyle}
          >
            <option value="">해당 없음</option>
            <option value="vegan">비건 (Vegan)</option>
            <option value="vegetarian">
              베지테리언 (Vegetarian)
            </option>
          </select>

        </section>


        {/* 완료 버튼 */}
        <button
          onClick={handleComplete}
          style={saveBtnStyle}
        >
          설정 완료 →
        </button>

      </div>

    </div>
  );
};


// ==================== 스타일 ====================

const pageStyle = {
  minHeight: 'calc(100vh - 56px)',
  background: '#F8F5F0',
  padding: '40px 20px',
  boxSizing: 'border-box',
};

const profileBox = {
  width: '100%',
  maxWidth: 520,
  margin: '0 auto',
  background: '#fff',
  borderRadius: 12,
  padding: '36px',
  boxSizing: 'border-box',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
};

const iconStyle = {
  fontSize: 36,
  textAlign: 'center',
  marginBottom: 10,
};

const titleStyle = {
  textAlign: 'center',
  fontSize: 26,
  fontWeight: 800,
  color: '#1A1A1A',
  marginBottom: 10,
};

const descriptionStyle = {
  textAlign: 'center',
  fontSize: 14,
  lineHeight: 1.7,
  color: '#777',
  marginBottom: 32,
};

const sectionStyle = {
  marginBottom: 20,
  padding: '20px',
  background: '#FAF8F5',
  borderRadius: 8,
  border: '1px solid #E0D8CC',
};

const sectionTitleStyle = {
  margin: '0 0 6px',
  fontSize: 16,
  fontWeight: 700,
  color: '#1A1A1A',
};

const sectionDescriptionStyle = {
  margin: '0 0 14px',
  fontSize: 12,
  color: '#888',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};

const allergyItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px',
  border: '1px solid',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%',
  height: 42,
  padding: '0 10px',
  background: '#fff',
  border: '1px solid #D8D0C6',
  borderRadius: 6,
  fontSize: 14,
  color: '#333',
  boxSizing: 'border-box',
};

const saveBtnStyle = {
  width: '100%',
  height: 48,
  marginTop: 8,
  background: '#B94A2C',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};

export default Profile;
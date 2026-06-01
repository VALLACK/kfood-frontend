import React, { useState } from 'react';
import { hasSupabaseConfig, supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  // 1. 상태 관리 (가이드라인 명시 항목)
  const navigate = useNavigate();
  const [allergies, setAllergies] = useState([]);
  const [religion, setReligion] = useState('');
  const [diet, setDiet] = useState('');
  const [loading, setLoading] = useState(false);

  const allergyOptions = ['땅콩', '갑각류', '유제품', '밀', '달걀', '견과류'];
  React.useEffect(() => {
    const savedId = localStorage.getItem('profile_id');
    if (savedId) {
      // 이미 저장된 프로필 있으면 불러오기 (선택사항)
    }
  }, []);
  // 다중 선택 핸들러
  const handleAllergyChange = (option) => {
    setAllergies(prev => 
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  // 2. Supabase 저장 로직
  const saveProfile = async () => {
    if (!hasSupabaseConfig || !supabase) {
      alert('Supabase 환경변수가 설정되지 않았습니다. 프로젝트 루트의 .env 파일을 확인해주세요.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { allergies, religion, diet }])
        .select();

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      localStorage.setItem('profile_id', data[0].id);
      alert('프로필이 저장되었습니다!');
      navigate('/scan'); 
      // 저장 후 스캔 페이지로 이동하는 로직 추가 가능
    }
    setLoading(false);
  };

  return (
    <div style={formContainerStyle}>
      <h2>👤 Personal Food Profile</h2>
      
      {/* 알레르기 다중 선택 (Checkboxes) */}
      <section style={sectionStyle}>
        <h4>1. 알레르기 선택 (Allergies)</h4>
        <div style={gridStyle}>
          {allergyOptions.map(option => (
            <label key={option} style={labelStyle}>
              <input 
                type="checkbox" 
                checked={allergies.includes(option)}
                onChange={() => handleAllergyChange(option)} 
              /> {option}
            </label>
          ))}
        </div>
      </section>

      {/* 종교 식단 선택 (Radio) */}
      <section style={sectionStyle}>
        <h4>2. 종교적 식단 (Religious Diet)</h4>
        <select value={religion} onChange={(e) => setReligion(e.target.value)} style={selectStyle}>
          <option value="">해당 없음</option>
          <option value="halal">할랄 (Halal)</option>
          <option value="kosher">코셔 (Kosher)</option>
        </select>
      </section>

      {/* 채식 여부 선택 */}
      <section style={sectionStyle}>
        <h4>3. 채식 성향 (Vegetarian)</h4>
        <select value={diet} onChange={(e) => setDiet(e.target.value)} style={selectStyle}>
          <option value="">해당 없음</option>
          <option value="vegan">비건 (Vegan)</option>
          <option value="vegetarian">베지테리언 (Vegetarian)</option>
        </select>
      </section>

      <button 
        onClick={saveProfile} 
        disabled={loading}
        style={saveBtnStyle}
      >
        {loading ? '저장 중...' : '설정 완료 및 저장'}
      </button>
    </div>
  );
};

// 스타일 객체
const formContainerStyle = { maxWidth: '400px', margin: '0 auto', padding: '20px', textAlign: 'left' };
const sectionStyle = { marginBottom: '20px', padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const labelStyle = { fontSize: '14px', cursor: 'pointer' };
const selectStyle = { width: '100%', padding: '8px', marginTop: '5px' };
const saveBtnStyle = { width: '100%', padding: '12px', backgroundColor: '#4A7C59', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default Profile;

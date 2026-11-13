import { useEffect, useRef, useState } from 'react';
import { readOnboardingLanguage, saveOnboardingLanguage } from './onboardingStorage';
import './Onboarding.css';

const LANGUAGES = [{ code: 'en', label: 'English' }, { code: 'ja', label: '日本語' }, { code: 'zh', label: '中文' }, { code: 'ko', label: '한국어' }];
const COPY = {
  en: {
    skip: 'Skip', back: 'Back', next: 'Next', language: 'Choose your language', example: 'Illustration only',
    titles: ['Your food guide in Busan', 'Snap the menu', 'Not sure? Ask the staff', 'Find restaurants before you go'],
    descriptions: ['Check Korean menus against your allergies, religion and diet.', 'Photograph a menu or choose a photo. Review the recognized names before checking each dish against your profile.', 'When ingredients vary by restaurant, show a Korean question or play it aloud. Update the result with the staff’s answer.', 'We are preparing restaurant search with profile-based menu results, Google ratings and map links.'],
    google: 'Sign in with Google', guest: 'Continue as Guest', coming: 'Restaurant search · Coming soon', notice: 'Results do not guarantee a dish is safe. Confirm ingredients and preparation with the staff.',
    demoMenus: ['Seafood hot pot', 'Pork rice soup', 'Braised short ribs'], demoQuestion: 'Does the pork rice soup contain salted shrimp?', demoAnswer: 'Read aloud in Korean', restaurantA: 'Restaurant A', restaurantB: 'Restaurant B',
  },
  ja: {
    skip: 'スキップ', back: '戻る', next: '次へ', language: '言語を選択', example: '画面イメージ',
    titles: ['釜山での食事をサポート', 'メニューを撮影', '不明な点は店員に確認', '来店前にお店を探す'],
    descriptions: ['アレルギー・宗教・食生活の条件に合わせて韓国のメニューを確認できます。', 'メニューを撮影するか写真を選び、読み取った料理名を修正してから分析します。', '店によって材料が異なる場合は、韓国語の質問を見せるか読み上げます。店員の回答を判定に反映します。', '食事条件に応じたメニュー判定、Google評価、地図リンクでお店を探す機能を準備中です。'],
    google: 'Googleでログイン', guest: 'ゲストとして続ける', coming: 'お店検索 · 近日公開', notice: '判定は安全を保証するものではありません。材料と調理方法を店員に確認してください。',
    demoMenus: ['海鮮鍋', '豚クッパ', '牛カルビの煮込み'], demoQuestion: '豚クッパにアミの塩辛は入っていますか？', demoAnswer: '韓国語で読み上げる', restaurantA: '飲食店 A', restaurantB: '飲食店 B',
  },
  zh: {
    skip: '跳过', back: '返回', next: '下一步', language: '选择语言', example: '界面示例',
    titles: ['釜山饮食小帮手', '拍摄菜单', '不确定？向店员确认', '到店前查找餐厅'],
    descriptions: ['根据您的过敏、宗教饮食和素食要求查看韩国菜单。', '拍摄或选择菜单照片，确认并修改识别出的菜名后再进行分析。', '配料因店而异时，可向店员展示韩语问题或播放语音，并根据回答更新判断结果。', '我们正在准备餐厅搜索功能，包括个人饮食条件判断、Google评分和地图链接。'],
    google: '使用 Google 登录', guest: '以访客身份继续', coming: '餐厅搜索 · 即将推出', notice: '判断结果不保证食用安全。请向店员确认配料和烹饪方式。',
    demoMenus: ['海鲜锅', '猪肉汤饭', '炖牛排骨'], demoQuestion: '猪肉汤饭里有虾酱吗？', demoAnswer: '用韩语朗读', restaurantA: '餐厅 A', restaurantB: '餐厅 B',
  },
  ko: {
    skip: '건너뛰기', back: '이전', next: '다음', language: '언어를 선택하세요', example: '설명용 예시',
    titles: ['부산에서 나에게 맞는 음식 찾기', '메뉴판을 찍어보세요', '확실하지 않다면 직원에게 확인', '방문 전에 식당을 찾아보세요'],
    descriptions: ['알레르기·종교·채식 조건에 맞춰 한국 음식 메뉴를 확인하세요.', '메뉴판을 촬영하거나 사진을 선택하고, 인식된 메뉴명을 확인·수정한 뒤 분석하세요.', '식당마다 다른 재료는 한국어 질문을 보여주거나 읽어주세요. 직원의 답변을 판정에 반영합니다.', '프로필별 메뉴 판정과 Google 평점, 지도 링크로 식당을 찾는 기능을 준비하고 있습니다.'],
    google: 'Google로 로그인', guest: '게스트로 계속', coming: '식당 찾기 · 추가 예정', notice: '판정은 섭취 안전을 보장하지 않습니다. 재료와 조리 방법은 직원에게 확인하세요.',
    demoMenus: ['해물조개전골', '돼지국밥', '소갈비찜'], demoQuestion: '돼지국밥에 새우젓이 들어가나요?', demoAnswer: '한국어로 읽어주기', restaurantA: '예시 식당 A', restaurantB: '예시 식당 B',
  },
};

function TourIcon({ type }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {type === 0 ? <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m8 12 3 3 5-6" /></>
        : <><path d="M4 6h4l2-3h4l2 3h4v14H4Z" /><circle cx="12" cy="12" r="3.5" /></>}
    </svg>
  );
}

export default function Onboarding({ onGoogleSignIn, onGuestContinue }) {
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState(readOnboardingLanguage);
  const titleRef = useRef(null);
  const copy = COPY[language];
  useEffect(() => { titleRef.current?.focus(); }, [step]);
  const chooseLanguage = (value) => { setLanguage(value); saveOnboardingLanguage(value); };

  return (
    <div className="onboarding-outer">
      <main className="onboarding-page" lang={language} aria-label="App introduction">
        <header className="onboarding-header">
          {step > 0 ? <button type="button" onClick={() => setStep((value) => value - 1)}>{copy.back}</button> : <span />}
          {step < 3 && <button type="button" onClick={() => setStep(3)}>{copy.skip}</button>}
        </header>
        <div className="onboarding-main">
          <section className={`onboarding-illustration onboarding-illustration-${step}`} aria-label={step ? copy.example : 'K-Food Safety Guide'}>
            {step === 0 && <>
              <div className="onboarding-icon"><TourIcon type={0} /></div>
              <strong className="onboarding-brand">K-Food Safety Guide</strong>
              <p className="onboarding-language-label">{copy.language}</p>
              <div className="onboarding-languages" role="group" aria-label={copy.language}>
                {LANGUAGES.map((item) => <button key={item.code} type="button" lang={item.code} aria-pressed={language === item.code} onClick={() => chooseLanguage(item.code)}>{item.label}</button>)}
              </div>
            </>}
            {step === 1 && <>
              <div className="onboarding-icon onboarding-camera"><TourIcon type={1} /></div>
              {['WARNING', 'CAUTION', 'SAFE'].map((level, index) => <div className="onboarding-menu" key={level}><span className={`onboarding-risk onboarding-risk-${level}`}>{level}</span><span>{copy.demoMenus[index]}</span></div>)}
            </>}
            {step === 2 && <div className="onboarding-question">
              <span className="onboarding-demo-label">{copy.example}</span>
              <strong lang="ko">돼지국밥에 새우젓이 들어가나요?</strong>
              <p>{copy.demoQuestion}</p>
              <span className="onboarding-demo-read">♫ {copy.demoAnswer}</span>
              <div className="onboarding-demo-answers"><span>Yes · 예</span><span>No · 아니요</span></div>
            </div>}
            {step === 3 && <>
              <span className="onboarding-demo-label">{copy.example}</span>
              {[copy.restaurantA, copy.restaurantB].map((name, index) => <div className="onboarding-restaurant" key={name}><div><strong>{name}</strong><span aria-label="Example rating">★ 4.x</span></div><p>Busan · {index === 0 ? 'Korean food' : 'Noodles'}</p><div className="onboarding-counts"><span className="onboarding-risk-SAFE">SAFE 12</span><span className="onboarding-risk-CAUTION">CAUTION 3</span><span className="onboarding-risk-WARNING">WARNING 1</span></div></div>)}
            </>}
          </section>
          <h1 ref={titleRef} tabIndex={-1}>{copy.titles[step]}</h1>
          <p className="onboarding-description">{copy.descriptions[step]}</p>
          {step === 1 && <p className="onboarding-help">{copy.example}</p>}
          {step === 3 && <p className="onboarding-coming">{copy.coming}</p>}
        </div>
        <footer className="onboarding-footer">
          <nav className="onboarding-progress" aria-label="Introduction pages">
            {[0, 1, 2, 3].map((index) => <button key={index} type="button" aria-label={`Page ${index + 1} of 4`} aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)} />)}
          </nav>
          {step < 3 ? <button type="button" className="onboarding-primary" onClick={() => setStep((value) => value + 1)}>{copy.next}</button>
            : <>
              <button type="button" className="onboarding-primary" onClick={onGoogleSignIn}>{copy.google}</button>
              <button type="button" className="onboarding-secondary" onClick={onGuestContinue}>{copy.guest}</button>
              <p className="onboarding-help">{copy.notice}</p>
            </>}
        </footer>
      </main>
    </div>
  );
}

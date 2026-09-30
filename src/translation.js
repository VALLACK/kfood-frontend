import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const t = {
  en: {
    // 공통 및 네비게이션
    home: "Home",
    history: "History",
    chat: "Chat",
    profile: "Profile",
    
    // Home 화면
    scanTitle: "Scan & Eat Safely",
    scanDesc: "Point your camera at any Korean menu to translate and check safety risks instantly",
    scanBtn: "Scan Menu",
    filterTitle: "My Dietary Filter Profile",
    edit: "Edit",
    guestNotice: "We are flagging risks based on your temporary guest conditions:",
    userNotice: "We are flagging risks based on your preset conditions:",
    noSettings: "No filter settings found. Tap Edit to set up.",

    // Profile 화면
    language: "LANGUAGE",
    allergies: "ALLERGIES",
    religiousDiet: "RELIGIOUS DIET",
    dietPreference: "DIET PREFERENCE",
    saveChanges: "Save Changes",
    saving: "Saving...",
    logOut: "Log Out",
    saveSuccess: "Profile saved successfully!",
    protectedAlert: "feature is available for signed-in users only.",
  },
  ko: {
    home: "홈",
    history: "기록",
    chat: "챗봇",
    profile: "프로필",
    
    scanTitle: "스캔하고 안전하게 드세요",
    scanDesc: "카메라로 한국어 메뉴판을 비추면 실시간으로 번역하고 위험 성분을 확인합니다",
    scanBtn: "메뉴 스캔하기",
    filterTitle: "나의 식이 필터 프로필",
    edit: "수정",
    guestNotice: "임시 설정된 게스트 조건으로 위험 요소를 확인합니다:",
    userNotice: "설정하신 프로필 조건으로 위험 요소를 확인합니다:",
    noSettings: "설정된 필터가 없습니다. 수정 버튼을 눌러 설정하세요.",

    language: "언어 설정",
    allergies: "알레르기",
    religiousDiet: "종교적 식단",
    dietPreference: "채식 / 식단 유형",
    saveChanges: "변경사항 저장",
    saving: "저장 중...",
    logOut: "로그아웃",
    saveSuccess: "프로필이 성공적으로 저장되었습니다!",
    protectedAlert: "기능은 로그인한 회원만 이용 가능합니다.",
  },
  ja: {
    home: "ホーム",
    history: "履歴",
    chat: "チャット",
    profile: "マイページ",
    
    scanTitle: "スキャンして安全に食べる",
    scanDesc: "韓国語のメニューにカメラを向けると、すぐに翻訳してリスクをチェックします",
    scanBtn: "メニューをスキャン",
    filterTitle: "食事フィルタープロファイル",
    edit: "編集",
    guestNotice: "一時設定されたゲスト条件でリスクをチェックしています:",
    userNotice: "設定されたプロファイル条件でリスクをチェックしています:",
    noSettings: "フィルター設定がありません。編集をタップして設定してください。",

    language: "言語",
    allergies: "アレルギー",
    religiousDiet: "宗教上の食事制限",
    dietPreference: "ベジタリアン / 食事タイプ",
    saveChanges: "変更を保存",
    saving: "保存中...",
    logOut: "ログアウト",
    saveSuccess: "プロファイルが正常に保存されました！",
    protectedAlert: "機能はログインユーザーのみ利用可能です。",
  },
  zh: {
    home: "首页",
    history: "历史",
    chat: "AI助手",
    profile: "个人中心",
    
    scanTitle: "扫码安全用餐",
    scanDesc: "将摄像头对准任何韩国菜单，即可实时翻译并检查安全风险",
    scanBtn: "扫描菜单",
    filterTitle: "我的饮食过滤设置",
    edit: "编辑",
    guestNotice: "正在根据您的临时游客设置进行风险提示：",
    userNotice: "正在根据您的预设条件进行风险提示：",
    noSettings: "未找到过滤设置。点击编辑进行设置。",

    language: "语言",
    allergies: "过敏原",
    religiousDiet: "宗教饮食",
    dietPreference: "素食 / 饮食偏好",
    saveChanges: "保存更改",
    saving: "保存中...",
    logOut: "退出登录",
    saveSuccess: "个人设置保存成功！",
    protectedAlert: "功能仅限登录用户使用。",
  }
};


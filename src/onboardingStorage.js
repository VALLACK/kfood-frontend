export const ONBOARDING_COMPLETE_KEY = 'onboardingCompleted';
const SUPPORTED_LANGUAGES = ['en', 'ja', 'zh', 'ko'];

export function readOnboardingLanguage() {
  const language = localStorage.getItem('onboardingLanguage') || localStorage.getItem('appLanguage');
  return SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
}

export function saveOnboardingLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) return;
  localStorage.setItem('onboardingLanguage', language);
  localStorage.setItem('appLanguage', language);
}

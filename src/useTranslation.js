import { t } from './translations';

export const useTranslation = () => {
  const currentLang = localStorage.getItem('appLanguage') || 'en';
  const text = t[currentLang] || t.en;
  
  return { text, currentLang };
};
// Backend-compatible choices. Broad legacy groups retain their original meaning.
export const ALLERGY_OPTIONS = [
  ['shellfish', 'Shellfish'], ['peanuts', 'Peanuts'], ['eggs', 'Eggs'], ['dairy', 'Milk'],
  ['gluten', 'Wheat'], ['soy', 'Soy'], ['sesame', 'Sesame'], ['tree_nuts', 'Tree nuts'],
  ['buckwheat', 'Buckwheat'], ['mackerel', 'Mackerel'], ['crab', 'Crab'], ['shrimp', 'Shrimp'],
  ['pork', 'Pork'], ['peach', 'Peach'], ['tomato', 'Tomato'], ['sulfite', 'Sulfites'],
  ['walnut', 'Walnut'], ['chicken', 'Chicken'], ['beef', 'Beef'], ['squid', 'Squid'],
  ['pine_nut', 'Pine nuts'], ['fish', 'Fish'],
].map(([value, label]) => ({ value, label }));
export const RELIGION_OPTIONS = [['halal', 'Halal'], ['kosher', 'Kosher'], ['hindu', 'Hindu']].map(([value,label]) => ({value,label}));
export const DIET_OPTIONS = [['vegan', 'Vegan'], ['vegetarian', 'Vegetarian'], ['pescatarian', 'Pescatarian'], ['lacto', 'Lacto'], ['ovo', 'Ovo']].map(([value,label]) => ({value,label}));
const LABELS = Object.fromEntries([...ALLERGY_OPTIONS, ...RELIGION_OPTIONS, ...DIET_OPTIONS].map(({value,label}) => [value,label]));
const ALIASES = { egg:'eggs', milk:'dairy', wheat:'gluten', peanut:'peanuts', sulfites:'sulfite', soybean:'soy', '알류':'eggs', '계란':'eggs', '달걀':'eggs', '우유':'dairy', '유제품':'dairy', '메밀':'buckwheat', '땅콩':'peanuts', '대두':'soy', '콩':'soy', '밀':'gluten', '글루텐':'gluten', '고등어':'mackerel', '게':'crab', '새우':'shrimp', '돼지고기':'pork', '복숭아':'peach', '토마토':'tomato', '아황산류':'sulfite', '호두':'walnut', '닭고기':'chicken', '쇠고기':'beef', '소고기':'beef', '오징어':'squid', '잣':'pine_nut', '참깨':'sesame', '생선':'fish', 'shell fish':'shellfish' };
const EXTRA_LABELS = { '조개류':'Clams / mussels', '조개':'Clams / mussels', '갑각류':'Crustaceans', crustacean:'Crustaceans', crustaceans:'Crustaceans', '견과류':'Nuts', nuts:'Nuts', '해산물':'Seafood', seafood:'Seafood' };
export const profileLabel = (key) => LABELS[ALIASES[key] || key] || EXTRA_LABELS[key] || key;
export function normalizeAllergies(raw) {
  const entries = Array.isArray(raw) ? raw.map(name => [name, 'unknown'])
    : raw && typeof raw === 'object' ? Object.entries(raw) : [];
  const normalized = {};
  for (const [name, severity] of entries) {
    if (typeof name !== 'string' || !name.trim()) continue;
    const trimmed = name.trim();
    const key = ALIASES[trimmed] || ALIASES[trimmed.toLowerCase()] || trimmed;
    const value = ['심각', 'severe'].includes(severity) ? '심각' : ['경미', 'mild'].includes(severity) ? '경미' : 'unknown';
    // Never let a duplicate mild alias replace an explicitly severe restriction.
    if (normalized[key] !== '심각') normalized[key] = value;
  }
  return normalized;
}
export const allergyEntries = (raw) => Object.entries(normalizeAllergies(raw));

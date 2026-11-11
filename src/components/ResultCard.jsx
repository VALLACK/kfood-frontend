
import { useState } from 'react';
import StaffQuestionCard from '../StaffQuestionCard';

const LEVEL_STYLE = {
  SAFE: { text: '#16A34A', bg: '#ECFDF5', border: '#BBF7D0' },
  CAUTION: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  WARNING: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const KIND_INFO = {
  allergy: {
    title: 'Allergy Hazard Detected',
    possibleTitle: 'Possible Allergen — Check with Staff',
    preset: 'Allergy',
  },
  religious: {
    title: 'Dietary Restriction Detected',
    possibleTitle: 'Dietary Check Needed',
    preset: 'Religious Diet',
  },
  religious_verify: {
    title: 'Certification Needed',
    possibleTitle: 'Certification Needed',
    preset: 'Certification',
  },
  diet: {
    title: 'Diet Conflict Detected',
    possibleTitle: 'Possible Diet Conflict — Check with Staff',
    preset: 'Diet',
  },
};

function groupReasons(reasons) {
  const map = new Map();

  for (const r of reasons) {
    if (!r.label) continue;

    const key = `${r.kind}:${r.label}:${r.certainty === 'confirmed' ? 'confirmed' : 'possible'}`;

    if (!map.has(key)) {
      map.set(key, {
        kind: r.kind,
        label: r.label,
        certainty: r.certainty,
        ingredients: [],
      });
    }

    const group = map.get(key);

    if (!group.ingredients.includes(r.ingredient)) {
      group.ingredients.push(r.ingredient);
    }

    if (r.certainty === 'confirmed') {
      group.certainty = 'confirmed';
    }
  }

  return [...map.values()];
}

function renderBreakdown(ingredients, groups) {
  const tagByName = new Map();

  groups.forEach((group) => {
    group.ingredients.forEach((name) => {
      tagByName.set(name, group);
    });
  });

  const nodes = [];
  let i = 0;

  while (i < ingredients.length) {
    const ingredient = ingredients[i];
    const name = ingredient.name_translated || ingredient.name;
    const group = tagByName.get(ingredient.name);

    if (group) {
      const runNames = [name];
      let j = i + 1;

      while (
        j < ingredients.length &&
        tagByName.get(ingredients[j].name) === group
      ) {
        runNames.push(
          ingredients[j].name_translated || ingredients[j].name
        );
        j++;
      }

      nodes.push(
        <span
          key={i}
          style={{ color: LEVEL_STYLE.WARNING.text, fontWeight: 700 }}
        >
          {runNames.join(', ')} ({group.label})
        </span>
      );

      i = j;
    } else {
      nodes.push(<span key={i}>{name}</span>);
      i++;
    }
  }

  return nodes.reduce((acc, node, idx) => {
    if (idx > 0) acc.push(', ');
    acc.push(node);
    return acc;
  }, []);
}
export default function ResultCard({
  item,
  onUpdated,
  showAnalysis = true,
}) {
  const risk = item.risk || {};
  const level = risk.level || 'SAFE';
  const style = LEVEL_STYLE[level] || LEVEL_STYLE.SAFE;
  
  const [open, setOpen] = useState(level === 'WARNING');

  const ingredients = item.ingredients || [];

  const groups = groupReasons([
    ...(risk.confirmed_reasons || []),
    ...(risk.possible_reasons || []),
  ]);

  const staffQuestions = risk.staff_questions || [];
  const displayName = item.menu_translated || item.menu;
  const displayPrice = item.prices?.[0] || item.price;

  const withRatio = ingredients.filter(
    (ingredient) => typeof ingredient.ratio_percent === 'number'
  );

  const isRealRatio = ingredients.some(
    (ingredient) => ingredient.ratio_source === 'menuzen'
  );

  const sourceLabel = {
    menuzen: 'Public Data (MenuZen)',
    menu_base: 'Internal Menu Database',
    menu_board: 'Menu Board',
    ai: 'AI Inference',
  };

  return (
    <div style={cardBase}>
      <button
        style={cardHeaderBtn}
        onClick={() => setOpen((value) => !value)}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={cardMenuName}>{item.menu}</div>
          {displayName !== item.menu && (
            <div style={cardMenuTranslated}>{displayName}</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              ...levelPill,
              color: style.text,
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}
          >
            {level}
          </span>

          {showAnalysis && (
            <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2.5"
                style={{
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
                }}
            >
                <polyline points="6 9 12 15 18 9" />
            </svg>
            )}
        </div>
      </button>

      {(item.menu_note || displayPrice || ['manual', 'ai'].includes(item.data_source)) && (
        <div style={menuSubText}>
            {item.menu_note || ''}
            {item.menu_note && displayPrice ? ' · ' : ''}
            {displayPrice ? `₩${displayPrice}` : ''}

            {(item.menu_note || displayPrice) &&
            ['manual', 'ai'].includes(item.data_source) && ' · '}
            
            {item.data_source === 'manual'
            ? 'Team-entered, typical recipe'
            : item.data_source === 'ai'
            ? 'AI Estimated'
            : ''}
        </div>
        )}
        
      

      {!open && staffQuestions.length > 0 && (
        <button
          style={staffHintBtn}
          onClick={() => setOpen(true)}
        >
          💬 Ask the staff ({staffQuestions.length}) · Needs confirmation
        </button>
      )}

      {/* 분석 정보 */}
      {showAnalysis && open && (
        <div style={cardBody}>
          {groups.map((group, i) => {
            const info = KIND_INFO[group.kind] || KIND_INFO.allergy;
            const isPossible = group.certainty !== 'confirmed';

            return (
              <div
                key={i}
                style={{
                  ...alertBox,
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                <div style={{ ...alertTitle, color: style.text }}>
                  <span style={{ marginRight: 6 }}>⚠️</span>
                  {isPossible ? info.possibleTitle : info.title}
                </div>

                <div style={alertDesc}>
                  {group.kind === 'religious_verify' ? (
                    <>
                      {isPossible ? 'May contain ' : 'Contains '}
                      <strong>{group.label}</strong> ({group.ingredients.join(', ')}).
                      {' Certification status has not been verified for your religious diet.'}
                      {level === 'CAUTION' &&
                        ' Please confirm certification with the staff before ordering.'}
                    </>
                  ) : isPossible ? (
                    <>
                      May contain <strong>{group.label}</strong>{' '}
                      ({group.ingredients.join(', ')}).
                      {level === 'CAUTION' &&
                        ' Please confirm with the staff before ordering.'}
                    </>
                  ) : (
                    <>
                      Contains <strong>{group.label}</strong>{' '}
                      ({group.ingredients.join(', ')}) which triggers
                      your {group.label} {info.preset} preset.
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {withRatio.length > 0 && (
            <div style={{ marginTop: groups.length > 0 ? 12 : 0 }}>
              <div style={breakdownLabel}>
                INGREDIENT BREAKDOWN{' '}
                {isRealRatio
                  ? '(Based on Actual Weight)'
                  : '(AI Estimated)'}
              </div>

              <div style={ratioList}>
                {withRatio.map((ingredient, i) => {
                  const name =
                    ingredient.name_translated || ingredient.name;

                  return (
                    <div key={i} style={ratioItem}>
                      <div style={ratioHeader}>
                        <span>{name}</span>
                        <strong>{ingredient.ratio_percent}%</strong>
                      </div>

                      <div style={ratioBar}>
                        <div
                          style={{
                            ...ratioBarFill,
                            width: `${Math.min(
                              Math.max(ingredient.ratio_percent, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ingredients.length > 0 && withRatio.length === 0 && (
            <div
              style={{
                marginTop: groups.length > 0 ? 12 : 0,
              }}
            >
              <div style={breakdownLabel}>INGREDIENT BREAKDOWN</div>
              <div style={breakdownText}>
                {renderBreakdown(ingredients, groups)}.
              </div>
            </div>
          )}

          {item.data_source && (
            <div style={reasoningBox}>
              <div style={breakdownLabel}>REASONING</div>
              <div style={reasoningText}>
                {sourceLabel[item.data_source] || item.data_source}
                {item.family?.length > 1 &&
                  ` · Compared with ${item.family.length} similar recipes`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 직원 확인 질문: 분석 정보 표시 여부와 관계없이 표시 */}
      {open && staffQuestions.length > 0 && (
        <div style={cardBody}>
          <div style={breakdownLabel}>ASK THE STAFF</div>

          {staffQuestions.map((question, i) => (
            <StaffQuestionCard
              key={`${question.kind}-${question.ingredient}-${i}`}
              item={item}
              question={question}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================== Inline Styles ==================== */

const staffHintBtn = {
  display: 'block',
  width: 'calc(100% - 32px)',
  margin: '0 16px 14px',
  textAlign: 'left',
  background: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: 10,
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 700,
  color: '#92400E',
  cursor: 'pointer',
};

const cardBase = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #F1F5F9',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
};

const cardHeaderBtn = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

const cardMenuName = {
  fontSize: 16,
  fontWeight: 800,
  color: '#0F172A',
};

const cardMenuTranslated = {
  fontSize: 12,
  color: '#64748B',
  marginTop: 2,
};

const levelPill = {
  fontSize: 11,
  fontWeight: 800,
  padding: '4px 10px',
  borderRadius: 20,
  letterSpacing: '0.3px',
};

const cardBody = {
  padding: '0 16px 16px',
};

const alertBox = {
  borderRadius: 12,
  padding: '12px 14px',
  marginBottom: 4,
};

const alertTitle = {
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 4,
  display: 'flex',
  alignItems: 'center',
};

const alertDesc = {
  fontSize: 13,
  color: '#334155',
  lineHeight: 1.5,
};

const breakdownLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.5px',
  color: '#94A3B8',
  marginBottom: 6,
};

const breakdownText = {
  fontSize: 13,
  color: '#334155',
  lineHeight: 1.6,
};

const ratioList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const ratioItem = {
  width: '100%',
};

const ratioHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 12,
  color: '#334155',
  marginBottom: 4,
};

const ratioBar = {
  width: '100%',
  height: 7,
  background: '#E2E8F0',
  borderRadius: 10,
  overflow: 'hidden',
};

const ratioBarFill = {
  height: '100%',
  background: '#64748B',
  borderRadius: 10,
};

const reasoningBox = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: '1px solid #F1F5F9',
};

const reasoningText = {
  fontSize: 12,
  color: '#64748B',
  lineHeight: 1.5,
};

const menuSubText = {
  fontSize: 11,
  color: '#64748B',
  padding: '0 16px 12px',
  textAlign: 'left',
};
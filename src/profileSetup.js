const keyFor = (userId) => `profileSetupSeen:${userId}`;

export function markProfileSetupSeen(userId) {
  if (userId) localStorage.setItem(keyFor(userId), 'true');
}

export function hasDietaryRestrictions(profile) {
  if (!profile) return false;
  const allergies = profile.allergies;
  const hasAllergies = Array.isArray(allergies) ? allergies.length > 0
    : allergies && typeof allergies === 'object' && Object.keys(allergies).length > 0;
  return Boolean(hasAllergies || profile.religious_diet || profile.vegetarian_type);
}

export async function needsProfileSetup(client, userId) {
  if (localStorage.getItem(keyFor(userId)) === 'true') return false;
  // Signup creates an empty row, so row existence alone does not mean setup is done.
  const { data, error } = await client.from('profiles')
    .select('allergies, religious_diet, vegetarian_type').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (hasDietaryRestrictions(data)) {
    markProfileSetupSeen(userId);
    return false;
  }
  return true;
}

export function scanFailure(error, stage) {
  const status = error.response?.status;
  if (status === 413) return {
    kind: 'unreadable', title: 'Photo is too large',
    message: 'This photo is too large for the server. Please photograph the menu in sections.',
  };
  if (status === 415) return {
    kind: 'unreadable', title: 'Unsupported photo format',
    message: 'Please choose a JPG, PNG, or WebP photo. For HEIC photos, save a JPG copy first.',
  };
  if (stage === 'preparing') return {
    kind: 'unreadable', title: 'Photo could not be prepared',
    message: error.message || 'Please choose another photo or photograph the menu again.',
  };
  if (status === 429) return {
    kind: 'connection', title: 'Request limit reached',
    message: 'The service has reached its request limit. Please wait a moment before trying again.',
  };
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return {
    kind: 'connection', title: 'The request timed out',
    message: 'The server is taking longer than expected. Please try again in a moment.',
  };
  if (error.isAxiosError && !error.response) return {
    kind: 'connection', title: "Can't reach the server",
    message: 'Check your internet connection and try again.',
  };
  if (status >= 500) return {
    kind: 'connection', title: 'Server temporarily unavailable',
    message: 'The server could not complete your request. Please try again in a moment.',
  };
  if ([400, 422].includes(status)) return {
    kind: 'unreadable', title: stage === 'ocr' ? "We couldn't read the menu" : 'Menu items could not be analyzed',
    message: stage === 'ocr'
      ? 'The photo may be blurry, too dark, or only part of the menu is visible.'
      : 'Please review the menu names or choose another photo.',
  };
  return { kind: 'connection', title: 'Something went wrong', message: 'Your request could not be completed. Please try again.' };
}

export const UNREADABLE_MENU = {
  kind: 'unreadable', title: "We couldn't read the menu",
  message: 'The photo may be blurry, too dark, or only part of the menu is visible.',
};

// An incomplete response must never become a default SAFE card.
export function validAnalysisResults(results) {
  return Array.isArray(results) && results.every((item) => (
    typeof item?.menu === 'string' && item.menu.trim()
    && ['SAFE', 'CAUTION', 'WARNING'].includes(item.risk?.level)
    && Array.isArray(item.ingredients)
    && item.ingredients.every((ingredient) => typeof ingredient?.name === 'string')
    && ['confirmed_reasons', 'possible_reasons', 'staff_questions'].every((key) => (
      item.risk[key] == null || (Array.isArray(item.risk[key])
        && item.risk[key].every((entry) => entry !== null && typeof entry === 'object'))
    ))
  ));
}

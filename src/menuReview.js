// Keep the complete OCR menu object: printed ingredient notes affect risk analysis.
export function createReviewRows(menus) {
  return (Array.isArray(menus) ? menus : [])
    .filter((menu) => menu && typeof menu.name === 'string')
    .map((menu, id) => ({ id, menu: { ...menu } }));
}

export function prepareAnalysisMenus(rows) {
  return rows
    .filter(({ menu }) => menu.name.trim())
    .map(({ menu }) => ({ ...menu, name: menu.name.trim() }));
}

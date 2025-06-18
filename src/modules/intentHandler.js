const INTENT_KEYWORDS = ['keripik', 'sambal', 'snack', 'minuman', 'produk'];

export function detectIntent(text) {
  const lower = text.toLowerCase();
  return INTENT_KEYWORDS.some(k => lower.includes(k));
}

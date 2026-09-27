// Removes the typical "AI generated" marks from text written by the model.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu;

export function cleanText(text: string): string {
  return (text || '')
    .replace(/\*\*/g, '')
    .replace(EMOJI, '')
    .replace(/\s+[—–]\s+/g, ', ') // "word — word" becomes "word, word"
    .replace(/[—–]/g, '-') // remaining long dashes (ranges) become hyphens
    .replace(/…/g, '...')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

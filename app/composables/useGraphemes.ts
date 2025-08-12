// Korrekt optælling af "grapheme clusters" (emoji, flag, skin tones, ZWJ)
export function countGraphemes(input: string | number): number {
  // Intl.Segmenter er bredt understøttet i moderne browsere
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
  // Fallback: approx ved at matche surrogate pairs + variation selectors
  if (typeof (Intl as any).Segmenter === 'function') {
    const seg = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' })
    let count = 0
    for (const _ of seg.segment(input)) count++
    return count
  }
  // Fallback – ikke perfekt, men bedre end .length
  const graphemes = Array.from(String(input))
  return graphemes.length
}

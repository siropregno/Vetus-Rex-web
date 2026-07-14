import DOMPurify from 'dompurify'
import { NEWS_LANGS } from '../utils/helpers'

export const MAX_NEWS_TITLE_LEN = 300
export const MAX_NEWS_CONTENT_LEN = 100000

/**
 * Validate a { en, es, de } map: every language present, non-empty (an empty
 * TipTap document `<p></p>` counts as empty), and within the length limit.
 *
 * @param {object} map              The per-language string map to validate.
 * @param {object} opts
 * @param {string} opts.field       Human label used in error messages ("Title").
 * @param {number} opts.maxLen      Max characters allowed per language.
 * @returns {{ message: string } | null}  An error object, or null when valid.
 */
export function validateNewsI18n(map, { field, maxLen }) {
  if (!map || typeof map !== 'object') {
    return { message: `Missing ${field} translations` }
  }
  for (const lang of NEWS_LANGS) {
    const value = map[lang]
    if (typeof value !== 'string' || !value.trim() || value === '<p></p>') {
      return { message: `${field} is required for all languages (${lang} missing)` }
    }
    if (value.length > maxLen) {
      return { message: `${field} too long for ${lang} (max ${maxLen} characters)` }
    }
  }
  return null
}

/**
 * Sanitize every language's HTML content in a { en, es, de } map.
 * Returns a new map; does not mutate the input.
 */
export function sanitizeI18nContent(map) {
  const out = {}
  for (const lang of NEWS_LANGS) {
    out[lang] = DOMPurify.sanitize(map[lang])
  }
  return out
}

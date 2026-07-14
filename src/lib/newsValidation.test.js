// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import {
  validateNewsI18n,
  sanitizeI18nContent,
  MAX_NEWS_TITLE_LEN,
  MAX_NEWS_CONTENT_LEN,
} from './newsValidation'

const fullTitle = { en: 'A', es: 'B', de: 'C' }
const titleOpts = { field: 'Title', maxLen: MAX_NEWS_TITLE_LEN }
const contentOpts = { field: 'Content', maxLen: MAX_NEWS_CONTENT_LEN }

describe('validateNewsI18n', () => {
  it('passes when all three languages are present and non-empty', () => {
    expect(validateNewsI18n(fullTitle, titleOpts)).toBeNull()
  })

  it('rejects a null or non-object map', () => {
    expect(validateNewsI18n(null, titleOpts)).toEqual({ message: 'Missing Title translations' })
    expect(validateNewsI18n('nope', titleOpts)).toEqual({ message: 'Missing Title translations' })
  })

  it('rejects a missing language', () => {
    const err = validateNewsI18n({ en: 'A', es: 'B' }, titleOpts)
    expect(err?.message).toContain('de missing')
  })

  it('rejects a blank / whitespace-only language', () => {
    expect(validateNewsI18n({ en: 'A', es: '   ', de: 'C' }, titleOpts)?.message).toContain('es missing')
  })

  it('treats an empty TipTap document as empty content', () => {
    const err = validateNewsI18n({ en: '<p>ok</p>', es: '<p></p>', de: '<p>ok</p>' }, contentOpts)
    expect(err?.message).toContain('es missing')
  })

  it('rejects content over the max length', () => {
    const tooLong = 'x'.repeat(MAX_NEWS_TITLE_LEN + 1)
    const err = validateNewsI18n({ en: tooLong, es: 'B', de: 'C' }, titleOpts)
    expect(err?.message).toContain('too long for en')
  })

  it('accepts content exactly at the max length', () => {
    const exact = 'x'.repeat(MAX_NEWS_TITLE_LEN)
    expect(validateNewsI18n({ en: exact, es: 'B', de: 'C' }, titleOpts)).toBeNull()
  })
})

describe('sanitizeI18nContent', () => {
  it('strips dangerous markup from every language', () => {
    const dirty = {
      en: '<p>ok</p><script>alert(1)</script>',
      es: '<img src=x onerror=alert(1)>',
      de: '<p>fine</p>',
    }
    const clean = sanitizeI18nContent(dirty)
    expect(clean.en).not.toContain('<script>')
    expect(clean.es).not.toContain('onerror')
    expect(clean.de).toBe('<p>fine</p>')
  })

  it('returns exactly the three languages', () => {
    const out = sanitizeI18nContent({ en: 'a', es: 'b', de: 'c', fr: 'x' })
    expect(Object.keys(out).sort()).toEqual(['de', 'en', 'es'])
  })
})

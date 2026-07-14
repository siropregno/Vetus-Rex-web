// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { getLocalizedNews, NEWS_LANGS } from './helpers'

describe('getLocalizedNews', () => {
  const article = {
    title_i18n: { en: 'Hello', es: 'Hola', de: 'Hallo' },
    content_i18n: { en: '<p>EN body</p>', es: '<p>ES body</p>', de: '<p>DE body</p>' },
    title: 'Legacy title',
    content: '<p>Legacy body</p>',
  }

  it('returns the requested language', () => {
    expect(getLocalizedNews(article, 'es')).toEqual({
      title: 'Hola',
      content: '<p>ES body</p>',
    })
    expect(getLocalizedNews(article, 'de').title).toBe('Hallo')
  })

  it('falls back to English when the requested language is empty', () => {
    const partial = {
      title_i18n: { en: 'Hello', es: '', de: '   ' },
      content_i18n: { en: '<p>EN</p>', es: '', de: '' },
    }
    expect(getLocalizedNews(partial, 'es')).toEqual({ title: 'Hello', content: '<p>EN</p>' })
    expect(getLocalizedNews(partial, 'de')).toEqual({ title: 'Hello', content: '<p>EN</p>' })
  })

  it('falls back to the first non-empty language when English is missing', () => {
    const noEnglish = {
      title_i18n: { en: '', es: 'Hola', de: 'Hallo' },
      content_i18n: { en: '', es: '<p>ES</p>', de: '<p>DE</p>' },
    }
    // Requesting a language that is present uses it directly...
    expect(getLocalizedNews(noEnglish, 'de').title).toBe('Hallo')
    // ...requesting an empty language with no English falls to the first filled.
    expect(getLocalizedNews(noEnglish, 'en').title).toBe('Hola')
  })

  it('falls back to legacy flat columns when i18n maps are absent', () => {
    const legacy = { title: 'Legacy title', content: '<p>Legacy body</p>' }
    expect(getLocalizedNews(legacy, 'es')).toEqual({
      title: 'Legacy title',
      content: '<p>Legacy body</p>',
    })
  })

  it('returns empty strings for a null article', () => {
    expect(getLocalizedNews(null, 'en')).toEqual({ title: '', content: '' })
  })

  it('returns empty strings when nothing is available', () => {
    expect(getLocalizedNews({}, 'en')).toEqual({ title: '', content: '' })
  })

  it('covers exactly en, es, de', () => {
    expect(NEWS_LANGS).toEqual(['en', 'es', 'de'])
  })
})

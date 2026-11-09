// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { buildThread, quoteSnippet, getRankKey, getForumRank, FORUM_RANKS, FIRST_COMMENT_NUMBER } from './forumThread'

const c = (id, created_at, parent_comment_id = null, content = `<p>${id}</p>`) =>
  ({ id, created_at, parent_comment_id, content })

describe('buildThread', () => {
  it('ordena por fecha y numera desde el #2 (el post es el #1)', () => {
    const thread = buildThread([
      c('b', '2026-03-22T10:05:00Z'),
      c('a', '2026-03-22T10:00:00Z'),
      c('c', '2026-03-22T10:10:00Z'),
    ])
    expect(FIRST_COMMENT_NUMBER).toBe(2)
    expect(thread.map(e => [e.comment.id, e.number])).toEqual([['a', 2], ['b', 3], ['c', 4]])
  })

  it('una respuesta lleva como cita el comentario al que responde', () => {
    const thread = buildThread([
      c('a', '2026-03-22T10:00:00Z'),
      c('r', '2026-03-22T10:05:00Z', 'a'),
    ])
    expect(thread[0].quoted).toBeNull()
    expect(thread[1].quoted.id).toBe('a')
  })

  it('permite citar una respuesta (ya no hay límite de anidación)', () => {
    const thread = buildThread([
      c('a', '2026-03-22T10:00:00Z'),
      c('r1', '2026-03-22T10:05:00Z', 'a'),
      c('r2', '2026-03-22T10:06:00Z', 'r1'),
    ])
    expect(thread[2].quoted.id).toBe('r1')
  })

  it('si el comentario citado ya no está, se muestra sin cita en vez de romper', () => {
    const thread = buildThread([c('r', '2026-03-22T10:05:00Z', 'borrado')])
    expect(thread[0].quoted).toBeNull()
  })

  it('desempata por id cuando dos comentarios tienen la misma fecha (orden estable)', () => {
    const same = '2026-03-22T10:00:00Z'
    const thread = buildThread([c('z', same), c('m', same)])
    expect(thread.map(e => e.comment.id)).toEqual(['m', 'z'])
  })

  it('no modifica el arreglo original y tolera entradas inválidas', () => {
    const input = [c('b', '2026-03-22T10:05:00Z'), c('a', '2026-03-22T10:00:00Z')]
    buildThread(input)
    expect(input.map(x => x.id)).toEqual(['b', 'a'])
    expect(buildThread(null)).toEqual([])
    expect(buildThread(undefined)).toEqual([])
  })
})

describe('quoteSnippet', () => {
  it('quita el HTML y colapsa espacios', () => {
    expect(quoteSnippet('<p>Hola   <strong>pepe</strong></p>\n<p>chau</p>')).toBe('Hola pepe chau')
  })

  it('recorta en una palabra y agrega puntos suspensivos', () => {
    const text = 'uno dos tres cuatro cinco seis siete ocho'
    const out = quoteSnippet(text, 20)
    expect(out.endsWith('…')).toBe(true)
    expect(out.length).toBeLessThanOrEqual(21)
    expect(text.startsWith(out.slice(0, -1))).toBe(true)
    expect(out).not.toMatch(/\s…$/)
  })

  it('no recorta si entra completo y tolera vacío', () => {
    expect(quoteSnippet('corto', 20)).toBe('corto')
    expect(quoteSnippet('')).toBe('')
    expect(quoteSnippet(null)).toBe('')
  })
})

describe('getRankKey', () => {
  it('admin es GM, moderator es MOD y el resto es jugador', () => {
    expect(getRankKey({ role: 'admin' })).toBe('gm')
    expect(getRankKey({ role: 'moderator' })).toBe('mod')
    expect(getRankKey({ role: 'user' })).toBe('player')
    expect(getRankKey(null)).toBe('player')
    expect(getRankKey(undefined)).toBe('player')
  })
})

describe('getForumRank', () => {
  it('sube de rango justo en cada umbral (bordes inclusivos)', () => {
    expect(getForumRank(0)).toBe('newcomer')
    expect(getForumRank(9)).toBe('newcomer')
    expect(getForumRank(10)).toBe('adventurer')
    expect(getForumRank(49)).toBe('adventurer')
    expect(getForumRank(50)).toBe('veteran')
    expect(getForumRank(149)).toBe('veteran')
    expect(getForumRank(150)).toBe('champion')
    expect(getForumRank(399)).toBe('champion')
    expect(getForumRank(400)).toBe('legend')
    expect(getForumRank(100000)).toBe('legend')
  })

  it('valores inválidos cuentan como 0', () => {
    expect(getForumRank(-5)).toBe('newcomer')
    expect(getForumRank(NaN)).toBe('newcomer')
    expect(getForumRank(undefined)).toBe('newcomer')
    expect(getForumRank('50')).toBe('newcomer')
  })

  it('los umbrales están ordenados y empiezan en 0', () => {
    expect(FORUM_RANKS[0].min).toBe(0)
    for (let i = 1; i < FORUM_RANKS.length; i++) {
      expect(FORUM_RANKS[i].min).toBeGreaterThan(FORUM_RANKS[i - 1].min)
    }
  })
})

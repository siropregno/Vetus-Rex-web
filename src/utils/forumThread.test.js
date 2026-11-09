import { describe, it, expect } from 'vitest'
import { buildNestedThread, getRankKey, getForumRank, getForumLevel, FORUM_RANKS, FIRST_COMMENT_NUMBER } from './forumThread'

const c = (id, created_at, parent_comment_id = null) => ({ id, created_at, parent_comment_id })
const t = (min) => `2026-03-22T10:${String(min).padStart(2, '0')}:00Z`

describe('buildNestedThread', () => {
  it('agrupa las respuestas debajo de su comentario, en orden', () => {
    const thread = buildNestedThread([
      c('r2', t(7), 'a'),
      c('a', t(0)),
      c('b', t(5)),
      c('r1', t(3), 'a'),
    ])
    expect(thread.map(e => e.comment.id)).toEqual(['a', 'b'])
    expect(thread[0].replies.map(r => r.comment.id)).toEqual(['r1', 'r2'])
    expect(thread[1].replies).toEqual([])
  })

  it('numera todos los mensajes en orden cronológico desde el #2 (el post es el #1)', () => {
    const thread = buildNestedThread([
      c('a', t(0)),
      c('r1', t(3), 'a'),
      c('b', t(5)),
      c('r2', t(7), 'a'),
    ])
    expect(FIRST_COMMENT_NUMBER).toBe(2)
    expect(thread[0].number).toBe(2)
    expect(thread[0].replies.map(r => r.number)).toEqual([3, 5])
    expect(thread[1].number).toBe(4)
  })

  it('una respuesta a otra respuesta va en el hilo de la raíz y dice a quién respondía', () => {
    const thread = buildNestedThread([
      c('a', t(0)),
      c('r1', t(3), 'a'),
      c('r2', t(4), 'r1'),
    ])
    expect(thread).toHaveLength(1)
    expect(thread[0].replies.map(r => r.comment.id)).toEqual(['r1', 'r2'])
    expect(thread[0].replies[0].replyTo).toBeNull()
    expect(thread[0].replies[1].replyTo.id).toBe('r1')
  })

  it('si el padre ya no existe, la respuesta se muestra como raíz en vez de perderse', () => {
    const thread = buildNestedThread([c('huerfana', t(2), 'borrado')])
    expect(thread.map(e => e.comment.id)).toEqual(['huerfana'])
  })

  it('no se cuelga con un ciclo de padres y no pierde mensajes', () => {
    const thread = buildNestedThread([c('x', t(0), 'y'), c('y', t(1), 'x')])
    const ids = thread.flatMap(e => [e.comment.id, ...e.replies.map(r => r.comment.id)])
    expect(ids.sort()).toEqual(['x', 'y'])
  })

  it('desempata por id con la misma fecha, no modifica la entrada y tolera vacíos', () => {
    const input = [c('z', t(0)), c('m', t(0))]
    expect(buildNestedThread(input).map(e => e.comment.id)).toEqual(['m', 'z'])
    expect(input.map(x => x.id)).toEqual(['z', 'm'])
    expect(buildNestedThread(null)).toEqual([])
    expect(buildNestedThread(undefined)).toEqual([])
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

describe('getForumLevel (color de la gema)', () => {
  it('un nivel por rango: 1 a 5 según los mismos umbrales', () => {
    expect(FORUM_RANKS).toHaveLength(5)
    expect(getForumLevel(0)).toBe(1)
    expect(getForumLevel(9)).toBe(1)
    expect(getForumLevel(10)).toBe(2)
    expect(getForumLevel(50)).toBe(3)
    expect(getForumLevel(150)).toBe(4)
    expect(getForumLevel(400)).toBe(5)
    expect(getForumLevel(99999)).toBe(5)
  })

  it('nunca da menos de 1 ni más que la cantidad de rangos', () => {
    for (const n of [-1, NaN, undefined, 0, 1, 10, 1e9]) {
      const level = getForumLevel(n)
      expect(level).toBeGreaterThanOrEqual(1)
      expect(level).toBeLessThanOrEqual(FORUM_RANKS.length)
    }
  })
})

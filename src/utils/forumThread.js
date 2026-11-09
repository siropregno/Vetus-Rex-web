// Lógica pura del hilo del foro (formato clásico): comentarios en orden, numerados y con cita.
// Sin dependencias de React ni de Supabase, para poder testearla.

import { stripHtml } from './helpers'

/** El post original es el mensaje #1; los comentarios siguen desde el #2. */
export const FIRST_COMMENT_NUMBER = 2

/**
 * Convierte la lista de comentarios en un hilo plano, en orden cronológico.
 * Cada entrada lleva su número de mensaje y, si respondía a otro comentario, ese comentario como cita.
 * @param {Array<{id: string, created_at: string, parent_comment_id?: string|null}>} comments
 * @returns {Array<{comment: object, number: number, quoted: object|null}>}
 */
export const buildThread = (comments) => {
  if (!Array.isArray(comments)) return []
  const byId = new Map(comments.map(c => [c.id, c]))
  return [...comments]
    .sort((a, b) => {
      const diff = new Date(a.created_at) - new Date(b.created_at)
      return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id))
    })
    .map((comment, index) => ({
      comment,
      number: FIRST_COMMENT_NUMBER + index,
      quoted: comment.parent_comment_id ? byId.get(comment.parent_comment_id) || null : null,
    }))
}

/**
 * Texto corto para mostrar dentro de una cita: sin HTML, espacios colapsados y recortado en palabra.
 * @param {string} html
 * @param {number} max cantidad máxima de caracteres (sin contar los puntos suspensivos)
 */
export const quoteSnippet = (html, max = 180) => {
  const text = stripHtml(html || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/**
 * Rol del autor: 'gm' (admin), 'mod' (moderador) o 'player'.
 * @param {{role?: string}|null|undefined} profile
 */
export const getRankKey = (profile) => {
  if (profile?.role === 'admin') return 'gm'
  if (profile?.role === 'moderator') return 'mod'
  return 'player'
}

/**
 * Rangos de foro por cantidad de mensajes (posts + comentarios), del más bajo al más alto.
 * `min` es inclusivo. Las claves se traducen en i18n como forum.forumRank.<key>.
 */
export const FORUM_RANKS = [
  { key: 'newcomer', min: 0 },
  { key: 'adventurer', min: 10 },
  { key: 'veteran', min: 50 },
  { key: 'champion', min: 150 },
  { key: 'legend', min: 400 },
]

/**
 * Rango de foro para una cantidad de mensajes. Valores inválidos o negativos cuentan como 0.
 * @param {number} messageCount
 * @returns {string} clave del rango
 */
export const getForumRank = (messageCount) => {
  const n = Number.isFinite(messageCount) && messageCount > 0 ? messageCount : 0
  let rank = FORUM_RANKS[0].key
  for (const r of FORUM_RANKS) {
    if (n >= r.min) rank = r.key
  }
  return rank
}

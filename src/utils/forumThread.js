// Lógica pura del hilo del foro: comentarios numerados, con las respuestas agrupadas debajo
// del comentario raíz al que pertenecen. Sin dependencias de React ni de Supabase, para poder testearla.

/** El post original es el mensaje #1; los comentarios siguen desde el #2. */
export const FIRST_COMMENT_NUMBER = 2

const byDate = (a, b) => {
  const diff = new Date(a.created_at) - new Date(b.created_at)
  return diff !== 0 ? diff : String(a.id).localeCompare(String(b.id))
}

/**
 * Agrupa los comentarios en hilos de un nivel: cada comentario raíz con sus respuestas debajo.
 * - La numeración es cronológica sobre todos los comentarios (#2, #3, …), para que cada mensaje
 *   tenga un número fijo aunque esté dentro de un hilo.
 * - Una respuesta a otra respuesta se muestra en el hilo de su raíz; `replyTo` indica a quién respondía.
 * - Si el comentario padre ya no existe, la respuesta pasa a mostrarse como raíz (no se pierde).
 * @param {Array<{id: string, created_at: string, parent_comment_id?: string|null}>} comments
 * @returns {Array<{comment: object, number: number, replies: Array<{comment: object, number: number, replyTo: object|null}>}>}
 */
export const buildNestedThread = (comments) => {
  if (!Array.isArray(comments)) return []
  const sorted = [...comments].sort(byDate)
  const byId = new Map(sorted.map(c => [c.id, c]))
  const numberOf = new Map(sorted.map((c, i) => [c.id, FIRST_COMMENT_NUMBER + i]))

  // Un comentario solo cuenta como padre si existe y es anterior a su respuesta.
  // Así cada paso retrocede en el tiempo: la subida siempre termina, incluso con datos corruptos (ciclos).
  const validParent = (comment) => {
    const parent = comment.parent_comment_id ? byId.get(comment.parent_comment_id) : null
    return parent && byDate(parent, comment) < 0 ? parent : null
  }

  const rootOf = (comment) => {
    let current = comment
    let parent = validParent(current)
    while (parent) {
      current = parent
      parent = validParent(current)
    }
    return current
  }

  const threads = new Map()
  for (const comment of sorted) {
    const root = rootOf(comment)
    if (root.id === comment.id) {
      threads.set(comment.id, { comment, number: numberOf.get(comment.id), replies: [] })
    }
  }
  for (const comment of sorted) {
    const root = rootOf(comment)
    if (root.id === comment.id) continue
    const parent = validParent(comment)
    threads.get(root.id).replies.push({
      comment,
      number: numberOf.get(comment.id),
      replyTo: parent && parent.id !== root.id ? parent : null,
    })
  }
  return [...threads.values()]
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

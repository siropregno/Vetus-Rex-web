// Simulación pura de las brasas de la portada: sin DOM ni canvas, para poder testearla.
// Las brasas nacen abajo, del lado derecho (donde está el farol del banner), suben ondulando y se apagan.

/** Cantidad de brasas según el ancho del banner (más chico, menos brasas). */
export const emberCount = (width) => Math.max(8, Math.min(40, Math.round(width / 34)))

/**
 * Crea una brasa.
 * @param {() => number} rand generador en [0, 1)
 * @param {number} width ancho del área
 * @param {number} height alto del área
 * @param {boolean} anywhere true al arrancar (repartidas en toda la altura); false para las que renacen abajo
 */
export const createEmber = (rand, width, height, anywhere = false) => ({
  x: width * (0.55 + rand() * 0.4),
  y: anywhere ? rand() * height : height + 10,
  r: 0.6 + rand() * 1.6,
  vy: 0.25 + rand() * 0.6,
  vx: (rand() - 0.5) * 0.3,
  life: 0,
  max: 260 + rand() * 300,
  phase: rand() * Math.PI * 2,
})

/** Avanza una brasa un cuadro (muta y devuelve la misma brasa). */
export const stepEmber = (e) => {
  e.life += 1
  e.y -= e.vy
  e.x += e.vx + Math.sin((e.life + e.phase * 40) / 40) * 0.25
  return e
}

/** true si la brasa ya terminó su vida o salió por arriba y hay que reemplazarla. */
export const isEmberDead = (e) => e.life > e.max || e.y < -10

/**
 * Opacidad de la brasa: aparece en los primeros 40 cuadros, se apaga hacia el final de su vida
 * y titila un poco. Siempre en [0, 1].
 */
export const emberAlpha = (e) => {
  const fadeIn = Math.min(1, e.life / 40)
  const fadeOut = 1 - e.life / e.max
  const flicker = 0.6 + 0.4 * Math.sin(e.life / 6 + e.phase)
  return Math.max(0, Math.min(1, fadeIn * fadeOut * flicker))
}

/** Color de la brasa (naranja; las más grandes, un poco más amarillas). */
export const emberColor = (e, alpha) => `rgba(255, ${130 + Math.round(e.r * 30)}, 60, ${alpha.toFixed(3)})`

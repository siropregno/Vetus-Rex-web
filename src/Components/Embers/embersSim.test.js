import { describe, it, expect } from 'vitest'
import { emberCount, createEmber, stepEmber, isEmberDead, emberAlpha, emberColor } from './embersSim'

// Generador determinista para que los tests no dependan del azar.
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

describe('emberCount', () => {
  it('escala con el ancho y queda entre 8 y 40', () => {
    expect(emberCount(0)).toBe(8)
    expect(emberCount(390)).toBe(11)
    expect(emberCount(1280)).toBe(38)
    expect(emberCount(4000)).toBe(40)
  })
})

describe('createEmber', () => {
  it('nace del lado derecho (donde está el farol) y abajo de todo', () => {
    const rand = seeded(7)
    for (let i = 0; i < 200; i++) {
      const e = createEmber(rand, 1000, 400)
      expect(e.x).toBeGreaterThanOrEqual(550)
      expect(e.x).toBeLessThan(950)
      expect(e.y).toBe(410)
      expect(e.vy).toBeGreaterThan(0)
    }
  })

  it('al arrancar se reparten en toda la altura', () => {
    const rand = seeded(3)
    const ys = Array.from({ length: 200 }, () => createEmber(rand, 1000, 400, true).y)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThan(400)
  })
})

describe('ciclo de vida', () => {
  it('sube en cada cuadro y termina muriendo', () => {
    const e = createEmber(seeded(11), 1000, 400)
    const startY = e.y
    stepEmber(e)
    expect(e.y).toBeLessThan(startY)
    let frames = 0
    while (!isEmberDead(e) && frames < 10000) { stepEmber(e); frames++ }
    expect(isEmberDead(e)).toBe(true)
    expect(frames).toBeLessThan(10000)
  })

  it('la opacidad siempre queda entre 0 y 1', () => {
    const e = createEmber(seeded(5), 1000, 400)
    for (let i = 0; i < 700; i++) {
      const a = emberAlpha(e)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThanOrEqual(1)
      stepEmber(e)
    }
  })

  it('empieza invisible y aparece de a poco', () => {
    const e = createEmber(seeded(9), 1000, 400)
    expect(emberAlpha(e)).toBe(0)
  })
})

describe('emberColor', () => {
  it('es un rgba naranja válido', () => {
    const e = createEmber(seeded(2), 1000, 400)
    expect(emberColor(e, 0.5)).toMatch(/^rgba\(255, \d{3}, 60, 0\.500\)$/)
  })
})

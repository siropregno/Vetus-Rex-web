import { useEffect, useRef } from 'react'
import { emberCount, createEmber, stepEmber, isEmberDead, emberAlpha, emberColor } from './embersSim'
import './Embers.css'

/**
 * Brasas que suben por el banner de la portada (decorativo, sin brillo).
 * - No anima si el usuario pidió reducir el movimiento.
 * - Se pausa cuando el banner no está a la vista o la pestaña está oculta.
 * - Se adapta al tamaño del contenedor y a pantallas de alta densidad (máximo 2x).
 */
const Embers = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const rand = Math.random
    let width = 0
    let height = 0
    let embers = []
    let frame = 0
    let onScreen = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = emberCount(width)
      embers = embers.slice(0, count)
      while (embers.length < count) embers.push(createEmber(rand, width, height, true))
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (let i = 0; i < embers.length; i++) {
        const e = stepEmber(embers[i])
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2)
        ctx.fillStyle = emberColor(e, emberAlpha(e))
        ctx.fill()
        if (isEmberDead(e)) embers[i] = createEmber(rand, width, height)
      }
      frame = requestAnimationFrame(draw)
    }

    const start = () => {
      if (!frame && onScreen && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const stop = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) start()
      else stop()
    })
    visibilityObserver.observe(canvas)
    const onVisibilityChange = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibilityChange)
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return <canvas ref={canvasRef} className="embers" aria-hidden="true" />
}

export default Embers

// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import BloubBot from '@/components/BloubBot.vue'
import { createBotInteraction, REACTION_DURATION_MS, useBotInteraction } from './interaction'

describe('createBotInteraction (logique pure)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('commence au repos sans survol ni reaction', () => {
    const inter = createBotInteraction()
    expect(inter.hover).toBe(false)
    expect(inter.reaction).toBeNull()
    expect(inter.expression).toBeNull()
  })

  it('affiche un visage heureux au survol du curseur', () => {
    const inter = createBotInteraction()
    inter.onPointerEnter()
    expect(inter.hover).toBe(true)
    expect(inter.expression).toBe('heureux')

    inter.onPointerLeave()
    expect(inter.hover).toBe(false)
    expect(inter.expression).toBeNull()
  })

  it('bascule vers effraye (choc) au premier double-tap', () => {
    const inter = createBotInteraction()
    inter.onDoubleTap()
    expect(inter.reaction).toBe('effraye')
    expect(inter.expression).toBe('effraye')
  })

  it('bascule vers colere au second double-tap', () => {
    const inter = createBotInteraction()
    inter.onDoubleTap() // 1er tap : effraye
    expect(inter.reaction).toBe('effraye')

    inter.onDoubleTap() // 2e tap : colere
    expect(inter.reaction).toBe('colere')
    expect(inter.expression).toBe('colere')

    inter.onDoubleTap() // 3e tap : re-effraye
    expect(inter.reaction).toBe('effraye')
    expect(inter.expression).toBe('effraye')
  })

  it('revient au sourire heureux apres expiration si le pointeur survole encore', () => {
    const inter = createBotInteraction()
    inter.onPointerEnter()
    expect(inter.expression).toBe('heureux')

    inter.onDoubleTap()
    expect(inter.expression).toBe('effraye')

    // avance le temps jusqu a expiration
    vi.advanceTimersByTime(REACTION_DURATION_MS)
    expect(inter.reaction).toBeNull()
    expect(inter.expression).toBe('heureux')
  })

  it('revient a l expression neutre apres expiration si le pointeur est parti', () => {
    const inter = createBotInteraction()
    inter.onPointerEnter()
    inter.onDoubleTap()
    expect(inter.expression).toBe('effraye')

    inter.onPointerLeave()
    expect(inter.expression).toBe('effraye')

    vi.advanceTimersByTime(REACTION_DURATION_MS)
    expect(inter.reaction).toBeNull()
    expect(inter.expression).toBeNull()
  })

  it('detecte le double-tap tactile sur deux taps rapides (< 350 ms)', () => {
    const inter = createBotInteraction()
    inter.onPointerDown({ pointerType: 'touch' })
    expect(inter.reaction).toBeNull()

    vi.advanceTimersByTime(200)
    inter.onPointerDown({ pointerType: 'touch' })
    expect(inter.reaction).toBe('effraye')
  })

  it('ignore les taps trop espaces (> 350 ms)', () => {
    const inter = createBotInteraction()
    inter.onPointerDown({ pointerType: 'touch' })
    vi.advanceTimersByTime(500)
    inter.onPointerDown({ pointerType: 'touch' })
    expect(inter.reaction).toBeNull()
  })

  it('notifie les changements d expression via le callback', () => {
    const log: Array<string | null> = []
    const inter = createBotInteraction({
      onExpressionChange: (expr) => log.push(expr)
    })
    inter.onPointerEnter()
    inter.onDoubleTap()
    inter.onPointerLeave()
    vi.advanceTimersByTime(REACTION_DURATION_MS)

    expect(log).toEqual(['heureux', 'effraye', 'effraye', null])
  })

  it('reinitialise completement l etat avec reset()', () => {
    const inter = createBotInteraction()
    inter.onPointerEnter()
    inter.onDoubleTap()
    expect(inter.expression).toBe('effraye')

    inter.reset()
    expect(inter.hover).toBe(false)
    expect(inter.reaction).toBeNull()
    expect(inter.expression).toBeNull()
  })
})

describe('useBotInteraction (composable Vue)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('met a jour les refs reactives', () => {
    const inter = useBotInteraction()
    expect(inter.hover.value).toBe(false)
    expect(inter.expression.value).toBeNull()

    inter.onPointerEnter()
    expect(inter.hover.value).toBe(true)
    expect(inter.expression.value).toBe('heureux')

    inter.onDoubleTap()
    expect(inter.reaction.value).toBe('effraye')
    expect(inter.expression.value).toBe('effraye')

    inter.onDoubleTap()
    expect(inter.reaction.value).toBe('colere')
    expect(inter.expression.value).toBe('colere')

    vi.advanceTimersByTime(REACTION_DURATION_MS)
    expect(inter.reaction.value).toBeNull()
    expect(inter.expression.value).toBe('heureux')

    inter.onPointerLeave()
    expect(inter.hover.value).toBe(false)
    expect(inter.expression.value).toBeNull()
  })
})

describe('BloubBot composant interactif', () => {
  it('met a jour l expression affichee sur survol et double-clic', async () => {
    const conteneur = document.createElement('div')
    document.body.appendChild(conteneur)

    const app = createApp({
      render() {
        return h(BloubBot, {
          shape: 'cercle',
          color: 'encre',
          expression: 'neutre',
          interactive: true,
          frozenAt: 1
        })
      }
    })

    app.mount(conteneur)
    await nextTick()

    const svg = conteneur.querySelector('svg')!
    expect(svg).toBeTruthy()
    expect(svg.classList.contains('cursor-pointer')).toBe(true)

    // Survol : doit passer en heureux
    svg.dispatchEvent(new Event('pointerenter'))
    await nextTick()

    // Double clic : doit passer en effraye (choc)
    svg.dispatchEvent(new Event('dblclick'))
    await nextTick()

    // Second double clic : doit passer en colere (angry)
    svg.dispatchEvent(new Event('dblclick'))
    await nextTick()

    app.unmount()
    conteneur.remove()
  })
})

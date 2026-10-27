import { computed, getCurrentInstance, onBeforeUnmount, ref, type Ref } from 'vue'


/** Expressions interactives declenchees par le survol ou le double-tap. */
export type ReactiveEmoji = 'heureux' | 'colere' | 'effraye' | null

/**
 * Duree d'affichage de la reaction (choc ou colere) en millisecondes
 * avant de revenir au repos ou au visage heureux.
 */
export const REACTION_DURATION_MS = 2200

export interface BotInteractionState {
  readonly hover: boolean
  readonly reaction: 'colere' | 'effraye' | null
  readonly expression: ReactiveEmoji
  onPointerEnter: () => void
  onPointerLeave: () => void
  onPointerDown: (e: { pointerType?: string }) => void
  onDoubleTap: () => void
  reset: () => void
}

/**
 * Logique pure d'interaction, sans dependance directe au DOM ni au framework.
 * Testable directement dans Vitest en environnement Node.
 */
export function createBotInteraction(
  options: {
    durationMs?: number
    onExpressionChange?: (expr: ReactiveEmoji) => void
  } = {}
): BotInteractionState {
  const durationMs = options.durationMs ?? REACTION_DURATION_MS
  let hover = false
  let reaction: 'colere' | 'effraye' | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastTapTime = 0

  function currentExpr(): ReactiveEmoji {
    if (reaction) return reaction
    if (hover) return 'heureux'
    return null
  }

  function notify() {
    options.onExpressionChange?.(currentExpr())
  }

  function onPointerEnter() {
    hover = true
    notify()
  }

  function onPointerLeave() {
    hover = false
    notify()
  }

  function onDoubleTap() {
    reaction = reaction === 'effraye' ? 'colere' : 'effraye'
    clearTimeout(timer)
    notify()
    timer = setTimeout(() => {
      reaction = null
      notify()
    }, durationMs)
  }

  function onPointerDown(e: { pointerType?: string }) {
    if (e.pointerType === 'touch') {
      const now = Date.now()
      if (now - lastTapTime < 350) {
        onDoubleTap()
        lastTapTime = 0
      } else {
        lastTapTime = now
      }
    }
  }

  function reset() {
    clearTimeout(timer)
    hover = false
    reaction = null
    notify()
  }

  return {
    get hover() {
      return hover
    },
    get reaction() {
      return reaction
    },
    get expression() {
      return currentExpr()
    },
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onDoubleTap,
    reset
  }
}

export interface BotInteractionController {
  hover: Ref<boolean>
  reaction: Ref<'colere' | 'effraye' | null>
  expression: Ref<ReactiveEmoji>
  onPointerEnter: () => void
  onPointerLeave: () => void
  onPointerDown: (e: PointerEvent) => void
  onDoubleTap: () => void
  reset: () => void
}

/**
 * Composable Vue branche sur les reactifs du composant.
 */
export function useBotInteraction(options: { durationMs?: number } = {}): BotInteractionController {
  const durationMs = options.durationMs ?? REACTION_DURATION_MS
  const hover = ref(false)
  const reaction = ref<'colere' | 'effraye' | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastTapTime = 0

  const expression = computed<ReactiveEmoji>(() => {
    if (reaction.value) return reaction.value
    if (hover.value) return 'heureux'
    return null
  })

  function onPointerEnter() {
    hover.value = true
  }

  function onPointerLeave() {
    hover.value = false
  }

  function onDoubleTap() {
    reaction.value = reaction.value === 'effraye' ? 'colere' : 'effraye'
    clearTimeout(timer)
    timer = setTimeout(() => {
      reaction.value = null
    }, durationMs)
  }

  function onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'touch') {
      const now = Date.now()
      if (now - lastTapTime < 350) {
        onDoubleTap()
        lastTapTime = 0
      } else {
        lastTapTime = now
      }
    }
  }

  function reset() {
    clearTimeout(timer)
    hover.value = false
    reaction.value = null
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      clearTimeout(timer)
    })
  }

  return {
    hover,
    reaction,
    expression,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onDoubleTap,
    reset
  }
}

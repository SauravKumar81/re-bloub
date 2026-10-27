/**
 * Generateur de code pret a l emploi pour l action emoji interactif.
 * Permet d exporter et d utiliser le composant / controlleur dans d autres projets.
 */

export type FrameworkCible = 'vanilla' | 'react' | 'vue'

export function codePourEmoji(framework: FrameworkCible = 'vanilla', svgMarkup = ''): string {
  const svgPropre = svgMarkup ? svgMarkup.replace(/`/g, '\\`').trim() : ''

  if (framework === 'vanilla') {
    return `// ============================================================================
// Interactive Emoji Action Controller (Vanilla JS / TS)
// Re-bloub by Saurav Kumar (https://github.com/Sauravkumar81)
// ============================================================================

export type EmojiAction = 'happy' | 'shock' | 'angry' | null

export interface EmojiOptions {
  /** Duree de la reaction (choc/colere) en ms avant retour au sourire */
  reactionDurationMs?: number
  /** Intervalle max entre deux taps sur ecran tactile en ms */
  touchTapIntervalMs?: number
  /** Callback appele lors d un changement d etat */
  onChange?: (state: { emoji: EmojiAction; hover: boolean }) => void
}

export class InteractiveEmojiController {
  private hover = false
  private reaction: 'shock' | 'angry' | null = null
  private timer: any = null
  private lastTap = 0
  private options: Required<EmojiOptions>

  constructor(options: EmojiOptions = {}) {
    this.options = {
      reactionDurationMs: options.reactionDurationMs ?? 2200,
      touchTapIntervalMs: options.touchTapIntervalMs ?? 350,
      onChange: options.onChange ?? (() => {})
    }
  }

  get currentEmoji(): EmojiAction {
    if (this.reaction) return this.reaction
    if (this.hover) return 'happy'
    return null
  }

  get isHovering(): boolean {
    return this.hover
  }

  onPointerEnter = () => {
    this.hover = true
    this.notify()
  }

  onPointerLeave = () => {
    this.hover = false
    this.notify()
  }

  onDoubleTap = () => {
    // Alterne entre effraye (shock) et colere (angry)
    this.reaction = this.reaction === 'shock' ? 'angry' : 'shock'
    clearTimeout(this.timer)
    this.notify()
    this.timer = setTimeout(() => {
      this.reaction = null
      this.notify()
    }, this.options.reactionDurationMs)
  }

  onPointerDown = (e: { pointerType?: string }) => {
    if (e.pointerType === 'touch') {
      const now = Date.now()
      if (now - this.lastTap < this.options.touchTapIntervalMs) {
        this.onDoubleTap()
        this.lastTap = 0
      } else {
        this.lastTap = now
      }
    }
  }

  /** Attache les ecouteurs sur n importe quel element HTML ou SVG */
  bind(element: HTMLElement | SVGElement) {
    element.addEventListener('pointerenter', this.onPointerEnter)
    element.addEventListener('pointerleave', this.onPointerLeave)
    element.addEventListener('pointerdown', this.onPointerDown as any)
    element.addEventListener('dblclick', this.onDoubleTap)
    return () => {
      element.removeEventListener('pointerenter', this.onPointerEnter)
      element.removeEventListener('pointerleave', this.onPointerLeave)
      element.removeEventListener('pointerdown', this.onPointerDown as any)
      element.removeEventListener('dblclick', this.onDoubleTap)
      clearTimeout(this.timer)
    }
  }

  private notify() {
    this.options.onChange({ emoji: this.currentEmoji, hover: this.hover })
  }
}

/** Monte le conteneur interactif avec le SVG dans n importe quelle page */
export function mountInteractiveEmoji(container: HTMLElement) {
  const wrapper = document.createElement('div')
  wrapper.style.cursor = 'pointer'
  wrapper.style.userSelect = 'none'
  wrapper.innerHTML = \`${svgPropre || '<span style="font-size:4rem">😊</span>'}\`
  container.appendChild(wrapper)

  const controller = new InteractiveEmojiController({
    onChange: ({ emoji }) => {
      // Reagit au survol et au double tap
      console.log('Emoji action:', emoji)
    }
  })
  const unbind = controller.bind(wrapper)
  return () => {
    unbind()
    wrapper.remove()
  }
}
`
  }

  if (framework === 'react') {
    return `// ============================================================================
// Interactive Emoji Action Hook (React / Next.js)
// Re-bloub by Saurav Kumar (https://github.com/Sauravkumar81)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react'

export type EmojiAction = 'happy' | 'shock' | 'angry' | null

export function useInteractiveEmoji(durationMs = 2200) {
  const [emoji, setEmoji] = useState<EmojiAction>(null)
  const lastTapRef = useRef(0)
  const timerRef = useRef<any>(null)
  const [reaction, setReaction] = useState<'shock' | 'angry' | null>(null)
  const [hover, setHover] = useState(false)

  const triggerDoubleTap = () => {
    setReaction((prev) => (prev === 'shock' ? 'angry' : 'shock'))
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setReaction(null)
    }, durationMs)
  }

  useEffect(() => {
    if (reaction) setEmoji(reaction)
    else if (hover) setEmoji('happy')
    else setEmoji(null)
  }, [reaction, hover])

  const handlers = {
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
    onDblClick: triggerDoubleTap,
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') {
        const now = Date.now()
        if (now - lastTapRef.current < 350) {
          triggerDoubleTap()
          lastTapRef.current = 0
        } else {
          lastTapRef.current = now
        }
      }
    }
  }

  return { emoji, handlers }
}

// Exemple de composant React :
export function EmojiAvatar() {
  const { emoji, handlers } = useInteractiveEmoji()
  const emojiMap = { happy: '😊', shock: '😱', angry: '😡' }

  return (
    <div {...handlers} style={{ cursor: 'pointer', fontSize: '3.5rem', userSelect: 'none' }}>
      {emoji ? emojiMap[emoji] : '😐'}
    </div>
  )
}
`
  }

  // Vue 3
  return `<!-- ======================================================================= -->
<!-- Interactive Emoji Action Component (Vue 3)                                -->
<!-- Re-bloub by Saurav Kumar (https://github.com/Sauravkumar81)               -->
<!-- ======================================================================= -->

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

const hover = ref(false)
const reaction = ref<'shock' | 'angry' | null>(null)
let timer: any = null
let lastTap = 0

const emoji = computed(() => {
  if (reaction.value) return reaction.value
  if (hover.value) return 'happy'
  return null
})

function onPointerEnter() {
  hover.value = true
}

function onPointerLeave() {
  hover.value = false
}

function onDoubleTap() {
  reaction.value = reaction.value === 'shock' ? 'angry' : 'shock'
  clearTimeout(timer)
  timer = setTimeout(() => {
    reaction.value = null
  }, 2200)
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'touch') {
    const now = Date.now()
    if (now - lastTap < 350) {
      onDoubleTap()
      lastTap = 0
    } else {
      lastTap = now
    }
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    class="cursor-pointer select-none text-6xl"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @dblclick="onDoubleTap"
  >
    <span v-if="emoji === 'happy'">😊</span>
    <span v-else-if="emoji === 'shock'">😱</span>
    <span v-else-if="emoji === 'angry'">😡</span>
    <span v-else>😐</span>
  </div>
</template>
`
}

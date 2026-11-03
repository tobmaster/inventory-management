import { ref, watch } from 'vue'

// Short, quiet, synthesized UI sounds via the Web Audio API (no audio files)
const STORAGE_KEY = 'ui-sounds'
const MASTER_GAIN = 0.12
const THROTTLE_MS = 60

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'on') return true
    if (saved === 'off') return false
  } catch {
    // Storage can be blocked (private mode); fall through to the default
  }
  // No explicit choice yet: stay silent for users who asked the OS for reduced motion
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Shared state (singleton pattern, like useFilters)
const enabled = ref(readPreference())
watch(enabled, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
  } catch {
    // Preference just won't persist
  }
})

let ctx = null
let master = null
let noiseBuffer = null
const lastPlayed = {}

// Browsers block audio until a user gesture, so the context is created lazily on first play
function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
    master = ctx.createGain()
    master.gain.value = MASTER_GAIN
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(c, { type = 'sine', from, to = from, start = 0, dur, peak = 0.5 }) {
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  // Exponential ramps can't touch 0, so start and end at a near-silent floor
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function sweep(c, { from, to, start = 0, dur, peak = 0.3 }) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const t0 = c.currentTime + start
  const src = c.createBufferSource()
  const filter = c.createBiquadFilter()
  const gain = c.createGain()
  src.buffer = noiseBuffer
  filter.type = 'bandpass'
  filter.Q.value = 6
  filter.frequency.setValueAtTime(from, t0)
  filter.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.3)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(gain).connect(master)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

const SOUNDS = {
  tap: (c) => {
    tone(c, { from: 1800, to: 1200, dur: 0.04, peak: 0.5 })
    tone(c, { type: 'triangle', from: 3600, dur: 0.03, peak: 0.12 })
  },
  nav: (c) => {
    sweep(c, { from: 600, to: 2400, dur: 0.14, peak: 0.35 })
    tone(c, { from: 880, to: 1320, start: 0.03, dur: 0.09, peak: 0.2 })
  },
  toggle: (c) => {
    tone(c, { from: 1200, dur: 0.03, peak: 0.35 })
    tone(c, { from: 1600, start: 0.04, dur: 0.03, peak: 0.35 })
  },
  open: (c) => tone(c, { type: 'triangle', from: 520, to: 880, dur: 0.12, peak: 0.4 }),
  close: (c) => tone(c, { type: 'triangle', from: 880, to: 520, dur: 0.12, peak: 0.4 }),
  success: (c) => {
    tone(c, { from: 880, dur: 0.09, peak: 0.45 })
    tone(c, { from: 1320, start: 0.08, dur: 0.14, peak: 0.45 })
  },
  error: (c) => {
    tone(c, { type: 'triangle', from: 330, to: 240, dur: 0.12, peak: 0.5 })
    tone(c, { type: 'triangle', from: 240, to: 160, start: 0.1, dur: 0.12, peak: 0.5 })
  }
}

function play(name) {
  if (!enabled.value || !SOUNDS[name]) return
  const now = performance.now()
  if (now - (lastPlayed[name] || 0) < THROTTLE_MS) return
  lastPlayed[name] = now
  const c = getContext()
  if (c) SOUNDS[name](c)
}

const CLICKABLE = '[data-sound], .sidebar-nav a, button, [role="button"], [role="switch"], .btn, select, input[type="checkbox"], input[type="radio"]'
let installed = false

// One delegated listener covers every component; 'click' also fires for keyboard activation
export function installUiSounds() {
  if (installed || typeof document === 'undefined') return
  installed = true
  document.addEventListener('click', (event) => {
    const el = event.target.closest?.(CLICKABLE)
    if (!el) return
    const explicit = el.dataset.sound
    if (explicit === 'off') return
    if (explicit) return play(explicit)
    if (el.closest('.sidebar-nav')) return play('nav')
    if (el.matches('input[type="checkbox"], input[type="radio"], [role="switch"]')) return play('toggle')
    play('tap')
  }, { capture: true, passive: true })
}

export function useSound() {
  const toggle = () => {
    enabled.value = !enabled.value
    // Confirm audibly when turning sounds on; the click itself fired while still muted
    if (enabled.value) play('toggle')
  }
  return { enabled, play, toggle }
}

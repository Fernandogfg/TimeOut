// Singleton AudioContext — must be unlocked via a user gesture before use
let ctx: AudioContext | null = null

/** Call this inside any button click handler to unlock audio for the session. */
export function unlockAudio() {
  if (!ctx) {
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
}

/** Plays a two-tone ding. Only works after unlockAudio() has been called. */
export function playDing() {
  if (!ctx || ctx.state !== 'running') return

  const beep = (freq: number, start: number, duration: number) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.connect(gain)
    gain.connect(ctx!.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.5, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
    osc.start(start)
    osc.stop(start + duration)
  }

  const t = ctx.currentTime
  beep(880, t, 0.25)         // A5
  beep(1100, t + 0.28, 0.35) // C#6
}

import { useEffect, useRef } from 'react'
import { useSettings } from '../store/settings'
import { playDing } from '../utils/audio'

interface Props {
  seconds: number
  running: boolean
  onFinish: () => void
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function RestTimer({ seconds, running, onFinish }: Props) {
  const { soundEnabled } = useSettings()
  const calledFinish = useRef(false)

  useEffect(() => {
    if (seconds === 0 && running && !calledFinish.current) {
      calledFinish.current = true
      onFinish()
      if (soundEnabled) playDing()
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    }
    if (seconds > 0) calledFinish.current = false
  }, [seconds, running, onFinish, soundEnabled])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-6xl font-mono font-bold tabular-nums text-green-400">
        {formatTime(seconds)}
      </div>
      {running && (
        <p className="text-sm text-gray-400 animate-pulse">descansando...</p>
      )}
    </div>
  )
}

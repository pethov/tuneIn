import React from 'react'
import '../../styles/play/playBar.css'

type Props = {
  currentTime: number
  duration: number
  progress: number
  barRef: React.RefObject<HTMLElement | null>
  onPointerDownBar: (e: React.PointerEvent) => void
  onPointerMoveBar: (e: React.PointerEvent) => void
  onPointerUpBar: (e: React.PointerEvent) => void
  fmt: (t: number) => string
}

const toISODuration = (secs: number) => `PT${Math.max(0, Math.round(secs))}S`
const SKIP_INTERVAL = 5
// Renders the scrubber/seek controls. Pointer events are delegated to the footer so the bar stays stateless.
export default function PlayBar({
  currentTime,
  duration,
  progress,
  barRef,
  onPointerDownBar,
  onPointerMoveBar,
  onPointerUpBar,
  fmt,
}: Props) {
  // Allow keyboard users to “scrub” in predictable 5s increments using Tab/Shift+Tab.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return
    const audio = document.querySelector<HTMLAudioElement>('.fp-audio')
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return

    const seekingForward = !event.shiftKey
    const delta = seekingForward ? SKIP_INTERVAL : -SKIP_INTERVAL
    const nextTime = Math.min(Math.max(audio.currentTime + delta, 0), audio.duration)

    if (nextTime === audio.currentTime) return

    const reachedBoundary =
      ((nextTime === audio.duration || Math.abs(nextTime - audio.duration) < 0.001) &&
        seekingForward) ||
      (nextTime === 0 && !seekingForward)

    audio.currentTime = nextTime

    if (!reachedBoundary) {
      event.preventDefault()
    }
  }

  return (
    <section className="fp-timeline" aria-label="Playback position">
      <time className="fp-time" dateTime={toISODuration(currentTime)}>
        {fmt(currentTime)}
      </time>

      <section
        ref={barRef}
        className="fp-bar"
        role="progressbar"
        aria-label="Progress bar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        onPointerDown={onPointerDownBar}
        onPointerMove={onPointerMoveBar}
        onPointerUp={onPointerUpBar}
        onPointerCancel={onPointerUpBar}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <section className="fp-bar-progress" style={{ width: `${progress}%` }} />

        <button
          type="button"
          className="fp-bar-thumb"
          style={{ left: `${progress}%` }}
          onPointerDown={onPointerDownBar}
          onPointerMove={onPointerMoveBar}
          onPointerUp={onPointerUpBar}
          onPointerCancel={onPointerUpBar}
          role="slider"
          tabIndex={-1}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${fmt(currentTime)} av ${fmt(duration)}`}
          aria-label="Seek"
        />
      </section>

      <time className="fp-time" dateTime={toISODuration(duration)}>
        {fmt(duration)}
      </time>
    </section>
  )
}

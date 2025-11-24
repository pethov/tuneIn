import { FaPause, FaPlay } from 'react-icons/fa'
import '../../styles/play/buttonBase.css'
import '../../styles/play/playButton.css'

type Props = {
  playing: boolean
  toggle?: () => void
  onClick?: (e: React.MouseEvent) => void
  className?: string
  ariaLabel?: string
}

// Presentational play/pause toggle. Consumers can either pass `toggle` (PlayerContext)
// or supply a bespoke onClick handler.
export default function PlayButton({ playing, toggle, onClick, className, ariaLabel }: Props) {
  const handler = (e: React.MouseEvent) => {
    if (onClick) return onClick(e)
    if (toggle) return toggle()
  }

  return (
    <button
      type="button"
      className={className ?? 'fp-btn fp-btn--primary'}
      onClick={handler}
      aria-label={ariaLabel ?? (playing ? 'Pause' : 'Play')}
      aria-pressed={playing}
      title={ariaLabel ?? (playing ? 'Pause' : 'Play')}
    >
      {playing ? (
        <FaPause aria-hidden="true" focusable="false" />
      ) : (
        <FaPlay aria-hidden="true" focusable="false" />
      )}
    </button>
  )
}

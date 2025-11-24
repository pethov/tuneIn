import { FaRandom } from 'react-icons/fa'
import '../../styles/play/buttonBase.css'
import '../../styles/play/shuffleButton.css'

type Props = {
  shuffle: boolean
  toggleShuffle: () => void
  className?: string
}

// Stateless UI for toggling shuffle so multiple views (Playlist, footer) share the same affordance.
export default function ShuffleButton({ shuffle, toggleShuffle, className }: Props) {
  return (
    <button
      type="button"
      className={className ?? 'fp-btn fp-shuffle-btn'}
      onClick={toggleShuffle}
      aria-pressed={shuffle}
      title={shuffle ? 'Shuffle: ON' : 'Shuffle: OFF'}
      aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
    >
      <FaRandom aria-hidden="true" focusable="false" />
    </button>
  )
}

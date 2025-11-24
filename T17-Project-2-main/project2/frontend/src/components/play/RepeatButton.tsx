import loopGray from '../../assets/icons/loop _gray_big.svg'
import loopWhite from '../../assets/icons/loop_white_big.svg'
import loopPink from '../../assets/icons/loop_pink_big.svg'
import loopOne from '../../assets/icons/loop_1_big.svg'
import '../../styles/play/buttonBase.css'
import '../../styles/play/repeatButton.css'

type Props = {
  repeatMode: 'off' | 'playlist' | 'one'
  toggleRepeatMode: () => void
  queueSourceType?: string | null
  className?: string
}

// Repeat is disabled for ad-hoc queues (e.g. search results). This button reflects that policy.
export default function RepeatButton({
  repeatMode,
  toggleRepeatMode,
  queueSourceType,
  className,
}: Props) {
  const disabled = !(queueSourceType === 'playlist' || queueSourceType === 'toptracks')
  let imgSrc = loopWhite
  let alt = 'Repeat off'
  if (!disabled) {
    if (repeatMode === 'one') {
      imgSrc = loopOne
      alt = 'Repeat one'
    } else if (repeatMode === 'playlist') {
      imgSrc = loopPink
      alt = 'Repeat playlist'
    } else {
      imgSrc = loopWhite
      alt = 'Repeat off'
    }
  } else {
    imgSrc = loopGray
    alt = 'Repeat disabled'
  }

  return (
    <button
      type="button"
      className={className ?? `fp-btn fp-repeat-btn ${repeatMode === 'one' ? 'fp-repeat-one' : ''}`}
      onClick={toggleRepeatMode}
      aria-pressed={repeatMode !== 'off'}
      aria-label={
        repeatMode === 'one'
          ? 'Repeat single track'
          : repeatMode === 'playlist'
            ? 'Repeat playlist'
            : 'Repeat disabled'
      }
      disabled={disabled}
      title={
        queueSourceType === 'search'
          ? 'Disabled for search results'
          : repeatMode === 'one'
            ? 'Repeat: ONE'
            : repeatMode === 'playlist'
              ? 'Repeat: ON'
              : 'Repeat: OFF'
      }
    >
      <img src={imgSrc} alt={alt} className="fp-repeat-icon" />
    </button>
  )
}

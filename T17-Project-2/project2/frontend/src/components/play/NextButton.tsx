import { FaStepForward } from 'react-icons/fa'
import '../../styles/play/buttonBase.css'

type Props = {
  onNext: () => void
  className?: string
  disabled?: boolean
  ariaLabel?: string
}

// Thin wrapper so every “next” control looks the same and exposes consistent a11y labels.
export default function NextButton({ onNext, className, disabled, ariaLabel }: Props) {
  return (
    <button
      type="button"
      className={className ?? 'fp-btn'}
      onClick={onNext}
      disabled={disabled}
      aria-label={ariaLabel ?? 'Next'}
      title={ariaLabel ?? 'Next'}
    >
      <FaStepForward aria-hidden="true" focusable="false" />
    </button>
  )
}

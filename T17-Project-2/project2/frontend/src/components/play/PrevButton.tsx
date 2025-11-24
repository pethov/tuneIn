import { FaStepBackward } from 'react-icons/fa'
import '../../styles/play/buttonBase.css'

type Props = {
  onPrev: () => void
  className?: string
  ariaLabel?: string
}

// Counterpart to NextButton so styling/ARIA stay uniform across the app.
export default function PrevButton({ onPrev, className, ariaLabel }: Props) {
  return (
    <button
      type="button"
      className={className ?? 'fp-btn'}
      onClick={onPrev}
      aria-label={ariaLabel ?? 'Previous'}
      title={ariaLabel ?? 'Previous'}
    >
      <FaStepBackward aria-hidden="true" focusable="false" />
    </button>
  )
}

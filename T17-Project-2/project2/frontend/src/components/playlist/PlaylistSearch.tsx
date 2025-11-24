import { useEffect, useId, useRef } from 'react'
import { FaSearch } from 'react-icons/fa'
import '../../styles/playlist/playlistPage.css'

type Props = {
  open: boolean
  term: string
  onToggle: () => void
  onChange: (val: string) => void
}

// Collapsible search bar reused by playlist-heavy pages.
export default function PlaylistSearch({ open, term, onToggle, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const inputId = useId()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <section className="playlist-search">
      <button
        type="button"
        className={`playlist-search-button ${open ? 'is-open' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={inputId}
      >
        <FaSearch aria-hidden="true" />
        <span>Search</span>
      </button>

      {open && (
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          className="playlist-search-input"
          value={term}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search playlists"
          aria-label="Search your playlists"
        />
      )}
    </section>
  )
}

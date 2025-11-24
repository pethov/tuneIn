import React from 'react'
import '../../styles/songSearch/searchInput.css'

type Props = {
  term: string
  setTerm: (s: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

// Controlled search bar so higher-level components own the debounced state.
export default function SearchInput({ term, setTerm, inputRef }: Props) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      role="search"
      aria-label="Song search"
      className="songsearch-form"
    >
      <label htmlFor="q" className="visually-hidden"></label>
      <input
        id="q"
        name="q"
        ref={inputRef}
        type="search"
        placeholder="Search for songs, artists, or albums"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        aria-label="Søkefelt"
        className="songsearch-input"
      />
    </form>
  )
}

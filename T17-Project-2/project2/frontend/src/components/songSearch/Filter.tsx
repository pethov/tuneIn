import React, { useCallback, useEffect, useState } from 'react'
import { graphqlFetch } from '../../lib/graphqlFetch'
import { Q_ARTISTS_FOR_TERM, Q_GENRES_FOR_TERM } from '../../graphql/playlist'

import '../../styles/songSearch/filter.css'

// Autocomplete filter stack for SongSearch. Fetches valid artists/genres based on the current term.

const normalize = (s: string) => s.trim()
const normalizeArr = (arr?: string[]) => (arr ?? []).map(normalize).filter(Boolean)
const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((val, idx) => val === b[idx])
const isAbortError = (error: unknown) =>
  (error instanceof DOMException || error instanceof Error) && error.name === 'AbortError'

type Props = {
  term: string // debounced search term (min 2 chars)
  selectedArtists?: string[]
  selectedGenres?: string[]
  onChange: (artists: string[], genres: string[]) => void
}

export default function Filters({
  term,
  selectedArtists = [],
  selectedGenres = [],
  onChange,
}: Props) {
  // Local state mirrors the props so the dropdown can be edited before committing changes upstream.
  const [artistOptions, setArtistOptions] = useState<string[]>([])
  const [genreOptions, setGenreOptions] = useState<string[]>([])
  const [artists, setArtists] = useState<string[]>(() => normalizeArr(selectedArtists))
  const [genres, setGenres] = useState<string[]>(() => normalizeArr(selectedGenres))

  const [artistOpen, setArtistOpen] = useState(false)
  const [genreOpen, setGenreOpen] = useState(false)
  const [artistQuery, setArtistQuery] = useState('')
  const [genreQuery, setGenreQuery] = useState('')

  const artistContainerRef = React.useRef<HTMLFieldSetElement | null>(null)
  const genreContainerRef = React.useRef<HTMLFieldSetElement | null>(null)

  const [artistOptionsLoadedFor, setArtistOptionsLoadedFor] = useState<string | null>(null)
  const [genreOptionsLoadedFor, setGenreOptionsLoadedFor] = useState<string | null>(null)

  const canUseArtist = (term?.trim().length ?? 0) >= 2 || (genres?.length ?? 0) > 0

  const effectiveTerm = (term?.trim().length ?? 0) >= 2 ? term.trim() : '' // tom streng = "ingen term"

  const loadArtistOptions = useCallback(
    async (genresParam?: string[]) => {
      const gList = genresParam ? normalizeArr(genresParam) : normalizeArr(genres)
      if (effectiveTerm.length < 2 && gList.length === 0) return []

      const genresKey = gList.join('|')
      const key = `${effectiveTerm}::${genresKey}`
      if (artistOptionsLoadedFor === key) return artistOptions

      const controller = new AbortController()
      try {
        const aResp = await graphqlFetch<
          { artistsForTerm: string[] },
          { term: string; genres?: string[] }
        >(
          Q_ARTISTS_FOR_TERM.loc?.source.body ?? '',
          {
            term: effectiveTerm,
            genres: gList.length ? gList : undefined,
          },
          { signal: controller.signal }
        )

        const newArtists = aResp?.artistsForTerm ?? []
        const normalized = Array.from(new Set(newArtists.map(normalize).filter(Boolean)))
        setArtistOptions(normalized)
        setArtistOptionsLoadedFor(key)
        return normalized
      } catch (error) {
        if (!isAbortError(error)) console.error('Filters loadArtistOptions error', error)
        return []
      }
    },
    [artistOptions, artistOptionsLoadedFor, effectiveTerm, genres]
  )

  const loadGenreOptions = useCallback(
    async (artistsParam?: string[]) => {
      const aList = artistsParam ? normalizeArr(artistsParam) : normalizeArr(artists)
      const aKey = aList.join('|')
      const key = `${effectiveTerm}::${aKey}`
      if (genreOptionsLoadedFor === key) return genreOptions

      const controller = new AbortController()
      try {
        const gResp = await graphqlFetch<
          { genresForTerm: string[] },
          { term: string; artists?: string[] }
        >(
          Q_GENRES_FOR_TERM.loc?.source.body ?? '',
          {
            term: effectiveTerm, // "" => alle sjangre (backend støtter)
            artists: aList.length ? aList : undefined,
          },
          { signal: controller.signal }
        )

        const newGenres = gResp?.genresForTerm ?? []
        const normalized = Array.from(new Set(newGenres.map(normalize)))
        setGenreOptions(normalized)
        setGenreOptionsLoadedFor(key)

        return normalized
      } catch (error) {
        if (!isAbortError(error)) console.error('Filters loadGenreOptions error', error)
        return []
      }
    },
    [artists, effectiveTerm, genreOptions, genreOptionsLoadedFor]
  )

  const lastSelectedArtists = React.useRef<string[]>(artists)
  // If the parent hands down new selections (e.g. session restore), mirror them locally.
  useEffect(() => {
    const next = normalizeArr(selectedArtists)
    if (!arraysEqual(lastSelectedArtists.current, next)) {
      lastSelectedArtists.current = next
      setArtists(next)
    }
    loadGenreOptions(next)
  }, [selectedArtists, loadGenreOptions])

  const lastSelectedGenres = React.useRef<string[]>(genres)
  // Same idea for genres: sync down and refresh artist options.
  useEffect(() => {
    const next = normalizeArr(selectedGenres)
    if (!arraysEqual(lastSelectedGenres.current, next)) {
      lastSelectedGenres.current = next
      setGenres(next)
    }
    loadArtistOptions(next)
  }, [selectedGenres, loadArtistOptions])

  const applyArtists = useCallback(
    async (nextArtists: string[]) => {
      const availableGenres = await loadGenreOptions(nextArtists.length ? nextArtists : undefined)
      const currentGenres = genres || []
      const stillValid = currentGenres.some((g) => availableGenres.includes(g))
      if (currentGenres.length > 0 && !stillValid) {
        setGenres([])
        onChange(nextArtists, [])
      } else {
        onChange(nextArtists, currentGenres)
      }
    },
    [genres, loadGenreOptions, onChange]
  )

  const applyGenres = useCallback(
    async (nextGenres: string[]) => {
      // Refresh artist options for the newly selected genres and ensure the
      // currently selected artists are still valid. If none of the selected
      // artists are valid for the chosen genres, reset artists to "All" (empty
      // selection) so the filter doesn't produce an empty result set.
      try {
        const available = await loadArtistOptions(nextGenres.length ? nextGenres : undefined)
        const current = artists || []
        const valid = current.filter((a) => available.includes(a))

        if (current.length > 0 && valid.length === 0) {
          // No selected artists remain valid — reset to "All artists"
          setArtists([])
          onChange([], nextGenres)
        } else if (valid.length !== current.length) {
          // Some selected artists were invalid — keep the intersection
          setArtists(valid)
          onChange(valid, nextGenres)
        } else {
          // All selected artists are still valid
          onChange(current, nextGenres)
        }
      } catch {
        // If loading fails, fall back to a conservative update
        onChange(artists, nextGenres)
      }
    },
    [artists, loadArtistOptions, onChange]
  )

  const saveArtists = useCallback(() => setArtistOpen(false), [])

  const saveGenres = useCallback(() => setGenreOpen(false), [])

  // Click-outside handlers to close popups
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node
      if (artistOpen && artistContainerRef.current && !artistContainerRef.current.contains(t)) {
        void saveArtists()
      }
      if (genreOpen && genreContainerRef.current && !genreContainerRef.current.contains(t)) {
        void saveGenres()
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [artistOpen, genreOpen, saveArtists, saveGenres])

  useEffect(() => {
    const handleCloseDropdowns = () => {
      setGenreOpen(false)
      setArtistOpen(false)
    }
    window.addEventListener('songsearch:close-filters', handleCloseDropdowns)
    return () => window.removeEventListener('songsearch:close-filters', handleCloseDropdowns)
  }, [])

  const toggleArtist = (val: string) => {
    setArtists((prev) => {
      const next = prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
      void applyArtists(next)
      return next
    })
  }

  const toggleGenre = (val: string) => {
    setGenres((prev) => {
      const next = prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
      void applyGenres(next)
      return next
    })
  }

  const isActivationKey = (key: string) =>
    key === 'Enter' || key === ' ' || key === 'Space' || key === 'Spacebar'

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLLIElement>, onToggle: () => void) => {
    if (isActivationKey(event.key)) {
      event.preventDefault()
      onToggle()
    }
  }

  const clearArtists = () => {
    setArtists([])
    void applyArtists([])
  }
  const clearGenres = () => {
    setGenres([])
    void applyGenres([])
  }

  const renderLabel = (list: string[], emptyLabel: string) =>
    list.length === 0 ? emptyLabel : list.join(', ')

  return (
    <section className="filters" aria-label="Filters">
      {/* GENRES */}
      <section ref={genreContainerRef} className="filter-group" role="group">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-label="Genres"
          onClick={() => {
            setGenreOpen((s) => !s)
            loadGenreOptions()
          }}
          className="select__control custom-select small"
          title={genres.length ? genres.join(', ') : 'All genres'}
        >
          <p className="button-label">{renderLabel(genres, 'All genres')}</p>
        </button>

        {genreOpen && (
          <section className="filter-popup" role="group" aria-label="Genre options">
            <input
              type="search"
              placeholder="Search for genre"
              value={genreQuery}
              onChange={(e) => setGenreQuery(e.target.value)}
              className="popup-input"
              autoFocus
            />

            <ul className="popup-list" role="listbox" aria-multiselectable="true">
              {(() => {
                const q = genreQuery.trim().toLowerCase()
                const filtered = genreOptions.filter((g) => g.toLowerCase().includes(q))
                const selectedMatching = genres.filter((g) => g.toLowerCase().includes(q))
                if (filtered.length === 0 && selectedMatching.length === 0)
                  return <p className="no-results">No results</p>

                return (
                  <>
                    {selectedMatching.length > 0 && (
                      <section className="popup-section">
                        {selectedMatching.map((g) => (
                          <li
                            key={`pinned-${g}`}
                            onClick={() => toggleGenre(g)}
                            onKeyDown={(e) => handleOptionKeyDown(e, () => toggleGenre(g))}
                            className="popup-item"
                            role="option"
                            tabIndex={0}
                            aria-selected
                          >
                            <p className="item-label selected">{g}</p>
                            <p className="check" aria-hidden>
                              ✓
                            </p>
                          </li>
                        ))}
                      </section>
                    )}

                    {filtered.map((g) => (
                      <li
                        key={g}
                        onClick={() => toggleGenre(g)}
                        onKeyDown={(e) => handleOptionKeyDown(e, () => toggleGenre(g))}
                        className="popup-item"
                        role="option"
                        tabIndex={0}
                        aria-selected={genres.includes(g)}
                      >
                        <p className="item-label">{g}</p>
                        {genres.includes(g) && (
                          <p className="check" aria-hidden>
                            ✓
                          </p>
                        )}
                      </li>
                    ))}
                  </>
                )
              })()}
            </ul>

            <footer className="popup-actions">
              <button type="button" onClick={clearGenres} className="btn-clear">
                Clear
              </button>
              <button type="button" onClick={saveGenres} className="btn-save">
                Save
              </button>
            </footer>
          </section>
        )}
      </section>
      {/* ARTISTS */}
      <section ref={artistContainerRef} className="filter-group" role="group">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-label="Artists"
          disabled={!canUseArtist}
          aria-disabled={!canUseArtist}
          onClick={() => {
            if (!canUseArtist) return
            setArtistOpen((s) => !s)
            loadArtistOptions()
          }}
          className={`select__control custom-select ${!canUseArtist ? 'disabled' : ''}`}
          title={artists.length ? artists.join(', ') : 'All artists'}
        >
          <p className="button-label">{renderLabel(artists, 'All artists')}</p>
        </button>

        {artistOpen && canUseArtist && (
          <section className="filter-popup" role="group" aria-label="Artists options">
            <input
              type="search"
              placeholder="Search for artist"
              value={artistQuery}
              onChange={(e) => setArtistQuery(e.target.value)}
              className="popup-input"
              autoFocus
            />

            <ul className="popup-list" role="listbox" aria-multiselectable="true">
              {(() => {
                const q = artistQuery.trim().toLowerCase()
                const filtered = artistOptions.filter((a) => a.toLowerCase().includes(q))
                const selectedMatching = artists.filter((a) => a.toLowerCase().includes(q))
                if (filtered.length === 0 && selectedMatching.length === 0)
                  return <p className="no-results">No results</p>

                return (
                  <>
                    {selectedMatching.length > 0 && (
                      <section className="popup-section">
                        {selectedMatching.map((a) => (
                          <li
                            key={`pinned-${a}`}
                            onClick={() => toggleArtist(a)}
                            onKeyDown={(e) => handleOptionKeyDown(e, () => toggleArtist(a))}
                            className="popup-item"
                            role="option"
                            tabIndex={0}
                            aria-selected
                          >
                            <p className="item-label selected">{a}</p>
                            <p className="check" aria-hidden>
                              ✓
                            </p>
                          </li>
                        ))}
                      </section>
                    )}

                    {filtered.map((a) => (
                      <li
                        className="popup-item"
                        role="option"
                        key={a}
                        onClick={() => toggleArtist(a)}
                        onKeyDown={(e) => handleOptionKeyDown(e, () => toggleArtist(a))}
                        tabIndex={0}
                        aria-selected={artists.includes(a)}
                      >
                        <p className="item-label">{a}</p>
                        {artists.includes(a) && (
                          <p className="check" aria-hidden>
                            ✓
                          </p>
                        )}
                      </li>
                    ))}
                  </>
                )
              })()}
            </ul>

            <footer className="popup-actions">
              <button type="button" onClick={clearArtists} className="btn-clear">
                Clear all
              </button>
              <button type="button" onClick={saveArtists} className="btn-save">
                Save
              </button>
            </footer>
          </section>
        )}
      </section>
    </section>
  )
}

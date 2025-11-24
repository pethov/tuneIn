// src/components/SongSearch.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Q_PLAYLISTS, M_ADD, M_CREATE, Q_SEARCH_TRACKS } from '../../graphql/playlist'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useTruncationLimits } from '../../hooks/useTruncationLimits'
import { graphqlFetch } from '../../lib/graphqlFetch'
import { usePlayer } from '../../player/PlayerContext'
import type { Track } from '../../types'
import '../../styles/songSearch/searchControls.css'
import Filter from './Filter'
import SortMenu from './SortMenu'
import SearchInput from './SearchInput'
import SearchResults from './SearchResults'
import CreatePlaylistModal from '../playlist/CreatePlaylistModal'
import { KEYS as SESSION_KEYS, readJSON, writeJSON } from '../../lib/session'

const PAGE_SIZE = 10

type SearchResponse = {
  searchTracks: {
    total: number
    items: Track[]
  }
}

type SearchVariables = {
  term: string
  artists?: string[]
  genres?: string[]
  limit?: number
  offset?: number
  sortDirection?: 'ASC' | 'DESC'
  sortBy?: 'TRACKNAME' | 'RELEASEDATE' | 'MOSTPOPULAR'
  filterBy?: 'ANY' | 'ARTIST' | 'TITLE'
}

type PlaylistsCache = {
  playlists: Array<{
    playlistId: string
    playlistName: string
    trackCount: number
    tracks: unknown[]
  }>
}

const isAbortError = (error: unknown) =>
  (error instanceof DOMException || error instanceof Error) && error.name === 'AbortError'

// High-level container for SongSearch. Handles persistence, GraphQL calls, and bridging into PlayerContext.
export default function SongSearch() {
  // ------------------- search/sort/filter state -------------------
  const [term, setTerm] = useState<string>(() => readJSON<string>(SESSION_KEYS.term) ?? '')
  const debouncedTerm = useDebouncedValue(term.trim().toLowerCase(), 350)

  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>(
    () => (readJSON<string>(SESSION_KEYS.sortDirection) as 'ASC' | 'DESC' | null) ?? 'DESC'
  )
  const [sortBy, setSortBy] = useState<'TRACKNAME' | 'RELEASEDATE' | 'MOSTPOPULAR'>(
    () =>
      (readJSON<string>(SESSION_KEYS.sortBy) as
        | 'TRACKNAME'
        | 'RELEASEDATE'
        | 'MOSTPOPULAR'
        | null) ?? 'MOSTPOPULAR'
  )
  const [filterBy] = useState<'ANY' | 'ARTIST' | 'TITLE'>('ANY')

  const [selectedArtists, setSelectedArtists] = useState<string[]>(
    () => readJSON<string[]>(SESSION_KEYS.artists) ?? []
  )
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    () => readJSON<string[]>(SESSION_KEYS.genres) ?? []
  )

  // ------------------- data / network-state -------------------
  const [items, setItems] = useState<Track[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const { setQueue, appendToQueue, queueSource, playing, queue, index, toggle } = usePlayer()
  const playingRef = useRef(playing)
  const queueSourceRef = useRef(queueSource)
  const appendToQueueRef = useRef(appendToQueue)

  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    queueSourceRef.current = queueSource
  }, [queueSource])

  useEffect(() => {
    appendToQueueRef.current = appendToQueue
  }, [appendToQueue])

  // Playlists (for Add-button on every row)
  const { data: playlistsData } = useQuery<{ playlists: PlaylistsCache['playlists'] }>(Q_PLAYLISTS)
  const [addToPlaylist] = useMutation(M_ADD, {
    onError(err) {
      console.error('addToPlaylist mutation error:', err)
      alert('Kunne ikke legge til i spilleliste: ' + (err?.message ?? 'ukjent feil'))
    },
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })

  const [openAddFor, setOpenAddFor] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [showCreatePl, setShowCreatePl] = useState(false)
  const [newPlName, setNewPlName] = useState('')
  // Track a pending track to add when creating a new playlist from the
  // per-track "Add" dropdown -> "New Playlist" action. This lets us
  // automatically add the originating track to the newly created playlist.
  const [pendingAddTrack, setPendingAddTrack] = useState<Track | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Feedback-state (only UI)
  const [justAddedIds, setJustAddedIds] = useState<Set<string>>(new Set())
  function markJustAdded(trackId: string, ms = 1500) {
    setJustAddedIds((prev) => {
      const next = new Set(prev)
      next.add(trackId)
      return next
    })
    window.setTimeout(() => {
      setJustAddedIds((prev) => {
        const next = new Set(prev)
        next.delete(trackId)
        return next
      })
    }, ms)
  }

  const [createPlaylist, { loading: creatingPl }] = useMutation(M_CREATE, {
    // Update the local Q_PLAYLISTS cache so newly created playlists
    // appear immediately in dropdowns without a refetch.
    update(cache, { data }) {
      try {
        const created = data?.createPlaylist
        if (!created) return
        const existing = cache.readQuery<PlaylistsCache>({ query: Q_PLAYLISTS })
        const next = (existing?.playlists ?? []).concat({
          playlistId: created.playlistId,
          playlistName: created.playlistName,
          trackCount: 0,
          tracks: [],
        })
        cache.writeQuery<PlaylistsCache>({ query: Q_PLAYLISTS, data: { playlists: next } })
      } catch {
        // ignore cache update errors
      }
    },
    onError: (e) => {
      console.error('Create playlist error:', e)
    },
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })

  // ------------------- dropdown handling -------------------
  useEffect(() => {
    if (!openAddFor) return
    const onDown = (e: MouseEvent) => {
      const el = dropdownRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) setOpenAddFor(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenAddFor(null)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [openAddFor])

  // List for global reset events (fired when clicking the TuneIn logo)
  useEffect(() => {
    const handler = () => {
      abortRef.current?.abort()
      setTerm('')
      setSelectedArtists([])
      setSelectedGenres([])
      setItems([])
      setTotal(0)
      setOffset(0)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('songsearch:reset', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('songsearch:reset', handler as EventListener)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!openAddFor) {
      document.documentElement.style.removeProperty('--songsearch-dd-left')
      document.documentElement.style.removeProperty('--songsearch-dd-top')
      document.documentElement.style.removeProperty('--songsearch-dd-width')
    }
  }, [openAddFor])

  useEffect(() => {
    if (!openAddFor) setAnchorRect(null)
  }, [openAddFor])

  const openPlayerAt = (i: number) => {
    // If clicked track is currently playing, toggle play/pause instead of re-queuing.
    if (queue.length > 0 && queue[index] && queue[index].trackId === items[i].trackId) {
      return toggle()
    }
    // set the whole current list as queue and start at i
    setQueue(items, i, items, 'search')
  }

  // focus the input when the create modal opens
  useEffect(() => {
    if (showCreatePl) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [showCreatePl])

  // ------------------- fetch helper -------------------
  // Centralized fetch helper that handles aborts, pagination, and deduping overlapping requests.
  const runSearch = useCallback(
    async ({
      termValue,
      artists,
      genres,
      offsetValue = 0,
      sort = sortDirection,
      by = sortBy,
      filter = filterBy,
      replace = true,
    }: {
      termValue: string
      artists?: string[]
      genres?: string[]
      offsetValue?: number
      sort?: 'ASC' | 'DESC'
      by?: 'TRACKNAME' | 'RELEASEDATE' | 'MOSTPOPULAR'
      filter?: 'ANY' | 'ARTIST' | 'TITLE'
      replace?: boolean
    }) => {
      const hasFilters = (artists?.length ?? 0) > 0 || (genres?.length ?? 0) > 0
      if (termValue.trim().length < 2 && !hasFilters) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current

      try {
        setLoading(true)
        if (replace) {
          setOffset(0)
          setItems([])
          setTotal(0)
        }

        const data = await graphqlFetch<SearchResponse, SearchVariables>(
          Q_SEARCH_TRACKS.loc?.source.body ?? '',
          {
            term: termValue,
            artists,
            genres,
            limit: PAGE_SIZE,
            offset: offsetValue,
            sortDirection: sort,
            sortBy: by,
            filterBy: filter,
          },
          { signal: controller.signal }
        )

        if (replace) {
          setItems(data.searchTracks.items)
          setError(null)
        } else {
          setItems((prev) => [...prev, ...data.searchTracks.items])
          // If the user is currently playing search results, append newly loaded
          // items to the active player queue so "Load more" adds to the queue.
          if (
            playingRef.current &&
            queueSourceRef.current === 'search' &&
            appendToQueueRef.current
          ) {
            appendToQueueRef.current(data.searchTracks.items, 'search')
          }
        }
        setTotal(data.searchTracks.total)
      } catch (err) {
        if (!isAbortError(err)) {
          console.error(err)
          try {
            setError((err as Error)?.message ? `Feil: ${(err as Error).message}` : 'Feil')
          } catch {
            setError('Feil')
          }
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [filterBy, sortBy, sortDirection]
  )

  // ------------------- search / sort effects -------------------
  const prevTermRef = useRef(debouncedTerm)

  useEffect(() => {
    const t = debouncedTerm.trim()
    const termChanged = prevTermRef.current !== debouncedTerm
    prevTermRef.current = debouncedTerm

    const hasFilters = selectedArtists.length > 0 || selectedGenres.length > 0

    if (t.length < 2 && !hasFilters) {
      setItems((prev) => (prev.length ? [] : prev))
      setTotal((prev) => (prev === 0 ? prev : 0))
      setOffset((prev) => (prev === 0 ? prev : 0))
      setSelectedArtists((prev) => (prev.length ? [] : prev))
      setSelectedGenres((prev) => (prev.length ? [] : prev))
      return
    }

    if (t.length < 2 && hasFilters) {
      runSearch({
        termValue: '',
        artists: selectedArtists,
        genres: selectedGenres,
        replace: true,
      })
      return
    }

    if (termChanged) {
      runSearch({
        termValue: t,
        artists: selectedArtists.length ? selectedArtists : undefined,
        genres: selectedGenres.length ? selectedGenres : undefined,
        replace: true,
      })
      return
    }

    runSearch({
      termValue: t,
      artists: selectedArtists.length ? selectedArtists : undefined,
      genres: selectedGenres.length ? selectedGenres : undefined,
      replace: true,
    })
  }, [debouncedTerm, runSearch, selectedArtists, selectedGenres])

  useEffect(() => {
    const t = term.trim().toLowerCase()
    if (selectedGenres.length === 0 && t.length < 2 && selectedArtists.length > 0) {
      setSelectedArtists([])
    }
  }, [selectedGenres.length, selectedArtists.length, term])

  // ------------------- paginering -------------------
  const hasMore = items.length < total

  // “Load more” reuses runSearch with append semantics to keep pagination logic isolated.
  const loadMore = async () => {
    if (!hasMore || loading) return
    const nextOffset = offset + PAGE_SIZE
    setOffset(nextOffset)

    const t = debouncedTerm.trim()
    const effectiveTerm = t.length >= 2 ? t : ''

    await runSearch({
      termValue: effectiveTerm,
      artists: selectedArtists.length ? selectedArtists : undefined,
      genres: selectedGenres.length ? selectedGenres : undefined,
      offsetValue: nextOffset,
      replace: false,
    })
  }

  // ------------------- persist to sessionStorage -------------------
  useEffect(() => writeJSON(SESSION_KEYS.term, term), [term])
  useEffect(() => writeJSON(SESSION_KEYS.artists, selectedArtists), [selectedArtists])
  useEffect(() => writeJSON(SESSION_KEYS.genres, selectedGenres), [selectedGenres])
  useEffect(() => writeJSON(SESSION_KEYS.sortBy, sortBy), [sortBy])
  useEffect(() => writeJSON(SESSION_KEYS.sortDirection, sortDirection), [sortDirection])

  // ------------------- handlers -------------------
  const onFiltersChange = (artists: string[], genres: string[]) => {
    const t = term.trim().toLowerCase()

    if (genres.length === 0 && t.length < 2) {
      abortRef.current?.abort()
      setSelectedArtists((prev) => (prev.length ? [] : prev))
      setSelectedGenres((prev) => (prev.length ? [] : prev))
      setItems((prev) => (prev.length ? [] : prev))
      setTotal((prev) => (prev === 0 ? prev : 0))
      setOffset((prev) => (prev === 0 ? prev : 0))
      return
    }

    const fixedArtists = artists
    setSelectedArtists(fixedArtists)
    setSelectedGenres(genres)

    const effectiveTerm = t.length >= 2 ? t : ''
    runSearch({
      termValue: effectiveTerm,
      artists: fixedArtists.length ? fixedArtists : undefined,
      genres: genres.length ? genres : undefined,
      replace: true,
    })
  }

  const applySort = (
    nextBy: 'TRACKNAME' | 'RELEASEDATE' | 'MOSTPOPULAR',
    nextDir: 'ASC' | 'DESC'
  ) => {
    setSortBy(nextBy)
    setSortDirection(nextDir)

    const t = term.trim().toLowerCase()
    const hasFilters = selectedArtists.length > 0 || selectedGenres.length > 0
    const effectiveTerm = t.length >= 2 ? t : ''
    if (!hasFilters && effectiveTerm === '') return

    runSearch({
      termValue: effectiveTerm,
      artists: selectedArtists.length ? selectedArtists : undefined,
      genres: selectedGenres.length ? selectedGenres : undefined,
      sort: nextDir,
      by: nextBy,
      replace: true,
    })
  }

  const countLabel = useMemo(() => {
    const hasFilters = selectedArtists.length > 0 || selectedGenres.length > 0
    if (debouncedTerm.length < 2 && !hasFilters) return ''
    if (loading && items.length === 0) return 'Loading results…'
    if (!loading && (debouncedTerm.length >= 2 || hasFilters) && total === 0)
      return 'No results found - but there is lots more music to explore!'

    return items.length ? `${items.length} / ${total} results` : ''
  }, [
    debouncedTerm.length,
    loading,
    items.length,
    total,
    selectedArtists.length,
    selectedGenres.length,
  ])

  const truncateLimits = useTruncationLimits()
  const canSort = (debouncedTerm?.trim().length ?? 0) >= 2 || (selectedGenres?.length ?? 0) > 0

  // ------------------- render -------------------
  return (
    <section aria-labelledby="song-search-heading">
      <SearchInput term={term} setTerm={setTerm} inputRef={inputRef} />

      {/* Controls row: sort + filters */}
      <section className="margin search-controls-wrapper">
        <span className="filter-by-label">Filter by</span>
        <Filter
          term={debouncedTerm}
          selectedArtists={selectedArtists}
          selectedGenres={selectedGenres}
          onChange={onFiltersChange}
        />
        <SortMenu
          sortBy={sortBy}
          sortDirection={sortDirection}
          onChange={applySort}
          enabled={canSort}
        />
      </section>

      <p className="results-count songsearch-results-count" aria-live="polite">
        {countLabel}
      </p>

      {error && (
        <p role="alert" className="songsearch-error">
          {error}
        </p>
      )}

      <SearchResults
        items={items}
        loading={loading}
        openAddFor={openAddFor}
        setOpenAddFor={setOpenAddFor}
        anchorRect={anchorRect}
        setAnchorRect={setAnchorRect}
        dropdownRef={dropdownRef}
        playlistsData={playlistsData}
        addToPlaylist={addToPlaylist}
        markJustAdded={markJustAdded}
        setShowCreatePl={setShowCreatePl}
        setPendingAddTrack={setPendingAddTrack}
        openPlayerAt={openPlayerAt}
        playing={playing}
        queueSource={queueSource}
        appendToQueue={appendToQueue}
        justAddedIds={justAddedIds}
        truncateLimits={truncateLimits}
      />

      {hasMore && (
        <button className="loadMore" onClick={loadMore} disabled={loading}>
          Load more tracks
        </button>
      )}

      <CreatePlaylistModal
        show={showCreatePl}
        setShow={setShowCreatePl}
        newPlName={newPlName}
        setNewPlName={setNewPlName}
        inputRef={inputRef}
        createPlaylist={createPlaylist}
        addToPlaylist={addToPlaylist}
        pendingAddTrack={pendingAddTrack}
        setPendingAddTrack={setPendingAddTrack}
        markJustAdded={markJustAdded}
        creatingPl={creatingPl}
        existingNames={playlistsData?.playlists?.map((p) => p.playlistName) ?? []}
      />
    </section>
  )
}

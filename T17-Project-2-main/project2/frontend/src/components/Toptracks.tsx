import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { FaPause, FaPlay } from 'react-icons/fa'
import AddButton from './songSearch/AddButton'
import CreatePlaylistModal from './playlist/CreatePlaylistModal'
import { usePlayer } from '../player/PlayerContext'
import { graphqlFetch } from '../lib/graphqlFetch'
import { ellipsizeEnd, clipArtists, useTruncationLimits } from '../hooks/useTruncationLimits'
import { M_ADD, M_CREATE, Q_PLAYLISTS } from '../graphql/playlist'
import type { Track } from '../types'
import '../styles/topTracks.css'

// Renders the global “Top tracks” shelf. The component fetches both the track list and
// the user’s playlists so tracks can be played immediately or added elsewhere.

type TopTracksResp = {
  topTracks: Array<Track & { listens?: number }>
}

type PlaylistsCache = {
  playlists: Array<{
    playlistId: string
    playlistName: string
    trackCount: number
    tracks: Array<{
      track: { trackId?: number | string | null; id?: number | string | null } | null
    }>
  }>
}

export default function Toptracks({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<TopTracksResp['topTracks']>([])
  const [, setLoading] = useState(false)
  const { setQueue, queue, index, toggle, playing, queueSource, appendToQueue } = usePlayer()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Keep track of mount state to avoid setState calls once the component is gone.
    let mounted = true
    setLoading(true)
    const Q = `query Top($limit: Int){ topTracks(limit: $limit) { trackId trackName artistName artworkUrl100 listens previewUrl } }`
    void graphqlFetch<TopTracksResp, { limit: number }>(Q, { limit })
      .then((d) => {
        if (mounted) {
          setItems(d.topTracks || [])
          setError(null)
        }
      })
      .catch((e) => {
        console.error(e)
        if (mounted) setError((e as Error)?.message ? `Feil: ${(e as Error).message}` : 'Feil')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [limit])

  // Playlist data feeds the shared AddButton dropdown. Apollo keeps it fresh as users create/delete lists.
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
  const [pendingAddTrack, setPendingAddTrack] = useState<Track | null>(null)
  const createInputRef = useRef<HTMLInputElement | null>(null)
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
      alert('Kunne ikke lage spilleliste: ' + (e?.message ?? 'ukjent feil'))
    },
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })

  const truncateLimits = useTruncationLimits()

  // Close popup when clicking outside or pressing Escape
  useEffect(() => {
    if (!openAddFor) return
    const handleDown = (e: MouseEvent | PointerEvent) => {
      const dropdown = dropdownRef.current
      if (dropdown && e.target instanceof Node && dropdown.contains(e.target)) return
      setOpenAddFor(null)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenAddFor(null)
    }
    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('keydown', handleKey)
    }
  }, [openAddFor])

  useEffect(() => {
    if (!openAddFor) setAnchorRect(null)
  }, [openAddFor])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!openAddFor) {
      document.documentElement.style.removeProperty('--songsearch-dd-left')
      document.documentElement.style.removeProperty('--songsearch-dd-top')
      document.documentElement.style.removeProperty('--songsearch-dd-width')
    }
  }, [openAddFor])

  return (
    <section aria-labelledby="top-tracks-heading">
      {error && (
        <p role="alert" className="toptracks-error">
          {error}
        </p>
      )}
      <ul className="track-row-list">
        {items.map((t, i) => {
          const trackKey = String(t.trackId ?? t.id ?? '')
          const wasJustAdded = justAddedIds.has(trackKey)

          return (
            <li key={t.trackId}>
              <article className="toptrack-row">
                <button
                  type="button"
                  className="track-row-btn"
                  onClick={() => {
                    // If clicked track is currently playing, toggle play/pause.
                    if (
                      queue.length > 0 &&
                      queue[index] &&
                      queue[index].trackId === (items[i] as Track).trackId
                    ) {
                      return toggle()
                    }
                    setQueue(items as Track[], i, items as Track[], 'toptracks')
                  }}
                  aria-label={`Play ${t.trackName} by ${t.artistName}`}
                >
                  <section className="track-info-row">
                    <section className="artwork-wrap">
                      <img
                        src={t.artworkUrl100 || '/placeholder.png'}
                        alt=""
                        width={56}
                        height={56}
                        className="playlist-artwork"
                      />
                      <section className="artwork-overlay">
                        {queue.length > 0 &&
                        queue[index] &&
                        queue[index].trackId === (items[i] as Track).trackId &&
                        playing ? (
                          <FaPause />
                        ) : (
                          <FaPlay />
                        )}
                      </section>
                    </section>

                    <article className="toplist-track-text">
                      <h3 className="toplist-track-title" title={t.trackName || undefined}>
                        {ellipsizeEnd(t.trackName, truncateLimits.title)}
                      </h3>
                      <p
                        className="toplist-track-artist"
                        title={t.artistName || (t.collectionName ?? undefined)}
                      >
                        {ellipsizeEnd(
                          clipArtists(t.artistName, 3) +
                            (t.collectionName
                              ? ` â€” ${ellipsizeEnd(t.collectionName, Math.max(16, Math.round(truncateLimits.artist * 0.4)))}`
                              : ''),
                          truncateLimits.artist
                        )}
                      </p>
                    </article>
                  </section>

                  <aside className="track-plays" aria-hidden>
                    <p>{t.listens ?? 0} plays</p>
                  </aside>
                </button>

                <section className="toptrack-add-overlay" aria-hidden={false}>
                  <AddButton
                    track={t}
                    wasJustAdded={wasJustAdded}
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
                    playing={playing}
                    queueSource={queueSource}
                    appendToQueue={appendToQueue}
                  />
                </section>
              </article>
            </li>
          )
        })}
      </ul>

      <CreatePlaylistModal
        show={showCreatePl}
        setShow={(val) => {
          setShowCreatePl(val)
          if (!val) {
            setNewPlName('')
            setPendingAddTrack(null)
          }
        }}
        newPlName={newPlName}
        setNewPlName={setNewPlName}
        inputRef={createInputRef}
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

// src/components/Playlist.tsx
// (no direct React import required with JSX transform)
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQuery } from '@apollo/client'
import type { Reference } from '@apollo/client'
import { usePlayer } from '../../player/PlayerContext'
import { pushRecentPlaylist } from '../../lib/recentPlaylists'
import type { Track } from '../../types'
import { useIsMobile } from '../../hooks/useIsMobile'
import '../../styles/playlist/Playlist.css'
import { Q_PLAYLIST, Q_PLAYLISTS, M_REMOVE_TRACK, M_DELETE } from '../../graphql/playlist'
import { FaRegTrashAlt, FaPlay, FaPause } from 'react-icons/fa'
import PlayButton from '../play/PlayButton'
import ShuffleButton from '../play/ShuffleButton'
import { ellipsizeEnd, clipArtists } from '../../hooks/useTruncationLimits'

// Full playlist view responsible for fetching data via Apollo and translating rows into
// the PlayerContext queue API.
type GetPlaylistData = {
  playlist: {
    playlistId: string
    playlistName: string
    tracks: Array<{
      position: number
      addedAt: string
      track: {
        trackId: string | null
        trackName: string | null
        artistName: string | null
        collectionName?: string | null
        artworkUrl100?: string | null
        previewUrl?: string | null
        genre?: string | null
        releasedate?: string | null
      } | null
    }>
  } | null
}
type GetPlaylistVars = { id: string }

const toNumber = (v: unknown, fallback: number) => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? (n as number) : fallback
}
export default function Playlist() {
  const { id } = useParams<{ id: string }>()
  const playlistId = id ?? ''
  const skipPlaylistQuery = playlistId.length === 0
  const rawNavigate = useNavigate()
  const navigate: ReturnType<typeof useNavigate> =
    rawNavigate ?? ((() => undefined) as ReturnType<typeof useNavigate>)
  const rawLocation = useLocation()
  const location =
    rawLocation ??
    ({
      key: 'default',
      pathname: '',
      search: '',
      hash: '',
      state: null,
    } as ReturnType<typeof useLocation>)

  // Router history behaves differently on the standalone playlist page (open via share link),
  // so fall back to pushing the Playlists index when there's no stack entry to pop.
  const goBack = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/playlists') // fallback = Playlists
  }

  const queryResult = useQuery<GetPlaylistData, GetPlaylistVars>(Q_PLAYLIST, {
    variables: { id: playlistId },
    skip: skipPlaylistQuery,
  })
  const {
    data,
    loading = false,
    error,
  } = queryResult ?? { data: undefined, loading: false, error: undefined }

  const noopAsync = async () => undefined

  const removeTrackTuple = useMutation(M_REMOVE_TRACK)
  const [removeTrackMutation = noopAsync] = removeTrackTuple ?? []
  const deleteTuple = useMutation(M_DELETE, {
    onError: (e) => {
      console.error('Delete playlist error:', e)
      alert('Could not delete playlist: ' + (e.message ?? 'Unkown error.'))
    },
    // Keep "Add to playlist" dropdowns fresh after deleting a playlist.
    update(cache, _res, { variables }) {
      const deletedId = variables?.id ? String(variables.id) : null
      if (!deletedId) return
      try {
        // Evict the playlist entity and prune it from the cached list.
        const cacheId = cache.identify({ __typename: 'Playlist', playlistId: deletedId })
        if (cacheId) cache.evict({ id: cacheId })
        cache.modify({
          fields: {
            playlists(existingRefs: readonly Reference[] = [], { readField }) {
              return existingRefs.filter(
                (ref) => String(readField('playlistId', ref)) !== deletedId
              )
            },
          },
        })
        cache.gc()
      } catch {
        // ignore cache update errors
      }
      // Also remove any stale "created" ordering entry so dropdown ordering stays clean.
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const KEY = 'tunein_playlist_created_map'
          const raw = localStorage.getItem(KEY)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object' && deletedId in parsed) {
              delete parsed[deletedId]
              localStorage.setItem(KEY, JSON.stringify(parsed))
            }
          }
        }
      } catch {
        // ignore storage issues
      }
    },
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })
  const [runDeletePlaylist = noopAsync, { loading: deleting = false } = {}] = deleteTuple ?? []

  const isMobile = useIsMobile()
  const titleLimit = isMobile ? 40 : 70
  const playerCtx = (usePlayer() ?? {}) as Partial<ReturnType<typeof usePlayer>>
  const {
    setQueue = () => undefined,
    queue = [],
    index = 0,
    playing = false,
    toggle = () => undefined,
    shuffle = false,
    toggleShuffle = () => undefined,
    queueSource = null,
    removeFromQueue = () => undefined,
  } = playerCtx

  if (!playlistId) return <p style={{ color: '#fff' }}>Missing playlist-id.</p>

  if (loading) return <p>Loading{'\u2026'}</p>
  if (error) return <p style={{ color: 'salmon' }}>Failed to load playlist.</p>

  const pl = data?.playlist
  if (!pl) return <p style={{ color: '#fff' }}>Could not find playlist.</p>

  const tracks: Track[] = pl.tracks.map((pt): Track => {
    const t = pt.track
    return {
      trackId: toNumber(t?.trackId, pt.position),
      trackName: t?.trackName ?? 'Unknown title',
      artistName: t?.artistName ?? 'Unknown artist',
      collectionName: t?.collectionName ?? undefined,
      artworkUrl100: t?.artworkUrl100 ?? undefined,
      previewUrl: t?.previewUrl ?? undefined,
      genre: t?.genre ?? undefined,
      releasedate: t?.releasedate ?? undefined,
    }
  })

  // Consider the queue the "same playlist" when it contains the same trackIds
  // even if the ordering differs (e.g. when shuffle is active). This ensures
  // the header PlayButton will toggle play/pause instead of re-queuing the
  // playlist when shuffle has rearranged the queue.
  const sameQueue =
    queue.length === tracks.length &&
    queue.every((q) => tracks.some((t) => t.trackId === q.trackId))

  const playAll = () => {
    if (sameQueue && queue.length > 0) toggle()
    else {
      // When shuffle is enabled, pick a random start index in the canonical
      // tracks array and let PlayerContext apply shuffle semantics. Pre-shuffling
      // here and passing an index relative to that pre-shuffle causes the
      // wrong track to be selected (PlayerContext expects the startIndex to
      // refer to the canonical ordering).
      const pid = pl.playlistId || id || ''
      try {
        if (pid) pushRecentPlaylist(pid)
      } catch {
        /* ignore */
      }
      if (shuffle) {
        const start = Math.floor(Math.random() * Math.max(1, tracks.length))
        setQueue(tracks, start, tracks, pid ? `playlist:${pid}` : 'playlist')
      } else {
        setQueue(tracks, 0, tracks, pid ? `playlist:${pid}` : 'playlist')
      }
    }
  }

  const playOne = (i: number) => {
    const pid = pl.playlistId || id || ''
    // If the clicked track is already the current playing track, toggle play/pause
    // instead of re-queuing. Compare by trackId because queue may be shuffled.
    try {
      if (pid) pushRecentPlaylist(pid)
    } catch {
      /* ignore */
    }
    if (queue.length > 0 && queue[index] && queue[index].trackId === tracks[i].trackId) {
      return toggle()
    }
    return setQueue(tracks, i, tracks, pid ? `playlist:${pid}` : 'playlist')
  }

  // Remove buttons reuse the same helper so optimistic UI behaviour stays consistent.
  const removeFromPlaylist = async (trackId: Track['trackId']) => {
    await removeTrackMutation({
      variables: { playlistId: playlistId, trackId: String(trackId) },
      refetchQueries: [{ query: Q_PLAYLIST, variables: { id: playlistId } }],
    })

    if (queueSource === `playlist:${playlistId}`) {
      removeFromQueue(trackId)
    }
  }

  const goToPlaylists = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/playlists')
  }

  // Delete is destructive, so double-check with the user and reuse whatever id backend expects.
  const handleDeletePlaylist = async () => {
    const ok = window.confirm(
      `This action deletes the playlist "${pl.playlistName}" and can not be undone.`
    )
    if (!ok) return
    // Noen backends vil ha pl.playlistId, andre klarer seg med URL-id
    await runDeletePlaylist({ variables: { id: pl.playlistId ?? String(id) } })
    goToPlaylists()
  }

  return (
    <section className="playlist-page" aria-labelledby="pl-title">
      <header className="playlist-header">
        <button onClick={goBack} className="back-btn">
          {'\u2190'} Go Back
        </button>

        <h2 id="pl-title" className="playlist-title">
          {pl.playlistName}
        </h2>
        <p className="playlist-meta">{tracks.length} tracks</p>

        <aside className="playlist-actions">
          <PlayButton
            /* Show the playing icon only when the global queue belongs to this playlist.
               If music is playing from somewhere else, show the Play icon. */
            playing={playing && sameQueue}
            onClick={(e) => {
              e.stopPropagation()
              // If this playlist is already the current queue, just toggle play/pause.
              // Otherwise, queue/play this playlist.
              if (sameQueue && queue.length > 0) {
                toggle()
              } else {
                playAll()
              }
            }}
            className="pl-playall-btn"
            ariaLabel="Play/Pause all"
          />
          <ShuffleButton
            shuffle={shuffle}
            toggleShuffle={() => toggleShuffle()}
            className={`pl-shuffle-btn ${shuffle ? 'active' : ''}`}
          />
          <button
            type="button"
            onClick={handleDeletePlaylist}
            aria-label="Slett spilleliste"
            title="Slett spilleliste"
            className="pl-delete-btn"
            disabled={deleting}
          >
            Delete playlist
          </button>
        </aside>
      </header>

      <ul className="track-row-list">
        {tracks.map((t, i) => (
          <li key={`${t.trackId}-${i}`}>
            <article className="track-row">
              <button
                type="button"
                onClick={() => playOne(i)}
                aria-label={`Play ${t.trackName} by ${t.artistName}`}
                className="track-row-btn"
              >
                <span className="artwork-wrap">
                  <img
                    src={t.artworkUrl100 || '/placeholder.png'}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="playlist-artwork"
                  />
                  <span className="artwork-overlay" aria-hidden="true">
                    {queue.length > 0 &&
                    queue[index] &&
                    queue[index].trackId === t.trackId &&
                    playing ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )}
                  </span>
                </span>

                <article className="track-row-text">
                  <h3 className="track-row-title" title={t.trackName || undefined}>
                    {ellipsizeEnd(t.trackName, titleLimit)}
                  </h3>
                  <p className="track-row-artist" title={t.artistName || undefined}>
                    {ellipsizeEnd(clipArtists(t.artistName, 3), titleLimit)}
                  </p>
                  {t.collectionName && (
                    <p className="track-row-collection" title={t.collectionName}>
                      {ellipsizeEnd(t.collectionName, titleLimit)}
                    </p>
                  )}
                </article>
              </button>

              <button
                type="button"
                onClick={() => removeFromPlaylist(t.trackId)}
                aria-label={`Remove ${t.trackName} from playlist`}
                className="playlist-remove-btn"
              >
                <FaRegTrashAlt />
              </button>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

import { useMutation, useQuery } from '@apollo/client'
import { useParams } from 'react-router-dom'
import PlaylistHeader from '../components/playlist/PlaylistHeader'
import PlaylistTrackList from '../components/playlist/PlaylistTrackList'
import type { PlaylistTrackEntry } from '../components/playlist/PlaylistTrackRow'
import { Q_PLAYLIST, M_REMOVE_TRACK, M_MOVE } from '../graphql/playlist'
import { usePlayer } from '../player/PlayerContext'
import { pushRecentPlaylist } from '../lib/recentPlaylists'
import { getOrCreateUserId } from '../lib/userId'
import type { Track } from '../types'
import '../styles/playlist/PlaylistView.css'

type PlaylistQueryData = {
  playlist: {
    playlistId: string
    playlistName: string
    tracks: Array<{
      position: number
      track: Track
    }>
  } | null
}

// Admin-style view for a single playlist with move/remove controls and the play-all button.
export default function PlaylistView() {
  const { id } = useParams()
  const userId = getOrCreateUserId()

  const { data, loading, refetch } = useQuery<PlaylistQueryData>(Q_PLAYLIST, {
    variables: { id, userId },
    skip: !id,
  })

  const [removeTrack] = useMutation(M_REMOVE_TRACK)
  const [moveTrack] = useMutation(M_MOVE)
  const { setQueue } = usePlayer()

  if (loading) return <p>Laster…</p>
  const pl = data?.playlist
  if (!pl) return <p>Fant ikke spilleliste.</p>

  const playlistEntries: PlaylistTrackEntry[] = pl.tracks.map((item) => ({
    position: item.position,
    track: item.track,
  }))
  const tracks = playlistEntries.map((entry) => entry.track)

  const playAll = async () => {
    // Record this playlist as recently played so Home shows it in recents
    try {
      if (pl.playlistId) pushRecentPlaylist(pl.playlistId)
    } catch {
      /* ignore */
    }

    setQueue(
      tracks.map((t) => ({
        trackId: Number(t.trackId),
        trackName: t.trackName,
        artistName: t.artistName,
        collectionName: t.collectionName ?? undefined,
        artworkUrl100: t.artworkUrl100 ?? undefined,
        previewUrl: t.previewUrl ?? undefined,
        genre: t.genre ?? undefined,
        releasedate: t.releasedate ?? undefined,
      })),
      0,
      tracks,
      // include playlist id so recent-playlist tracking can persist it
      pl.playlistId ? `playlist:${pl.playlistId}` : 'playlist'
    )
  }

  // Basic reorder handler wired to PlaylistTrackRow move arrows.
  const move = async (trackid: string | number, dir: -1 | 1) => {
    const items = playlistEntries
    const idx = items.findIndex((item) => String(item.track.trackId) === String(trackid))
    if (idx < 0) return
    const target = idx + dir
    if (target < 0 || target >= items.length) return
    const toPos = items[target].position
    await moveTrack({
      variables: { playlistId: pl.playlistId, trackId: trackid, toPosition: toPos },
    })
    refetch()
  }

  // Remove handler remains simple for now; consider optimistic updates if UX needs it.
  const remove = async (trackid: string | number) => {
    await removeTrack({ variables: { playlistId: pl.playlistId, trackId: trackid } })
    refetch()
  }

  return (
    <main className="page playlist-page">
      <PlaylistHeader title={pl.playlistName} onPlayAll={playAll} />
      <PlaylistTrackList tracks={playlistEntries} onMove={move} onRemove={remove} />
    </main>
  )
}

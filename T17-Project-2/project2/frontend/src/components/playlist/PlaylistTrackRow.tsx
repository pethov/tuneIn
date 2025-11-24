import { memo } from 'react'
import type { Track } from '../../types'
import '../../styles/playlist/PlaylistTrackRow.css'

export interface PlaylistTrackEntry {
  position: number
  track: Track & { trackId: number | string }
}

interface PlaylistTrackRowProps {
  entry: PlaylistTrackEntry
  onMove: (trackId: string | number, direction: -1 | 1) => void
  onRemove: (trackId: string | number) => void
}

// Single track entry rendered in playlist admin tables.
function PlaylistTrackRow({ entry, onMove, onRemove }: PlaylistTrackRowProps) {
  const { position, track } = entry
  const trackId = track.trackId

  return (
    <li className="playlist-row">
      <span>{position}</span>
      <article className="track-info">
        {track.artworkUrl100 && <img src={track.artworkUrl100} width={40} height={40} alt="" />}
        <article className="track-text">
          <p className="track-name">{track.trackName}</p>
          <small>{track.artistName}</small>
        </article>
      </article>

      <nav className="track-controls" aria-label="Track controls">
        <button onClick={() => onMove(trackId, -1)}>↑</button>
        <button onClick={() => onMove(trackId, 1)}>↓</button>
        <button onClick={() => onRemove(trackId)}>Fjern</button>
      </nav>
    </li>
  )
}

// Memoization keeps big playlists snappy when only one item updates.
export default memo(PlaylistTrackRow)

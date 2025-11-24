import PlaylistTrackRow from './PlaylistTrackRow'
import type { PlaylistTrackEntry } from './PlaylistTrackRow'
import '../../styles/playlist/PlaylistTrackList.css'

interface PlaylistTrackListProps {
  tracks: PlaylistTrackEntry[]
  onMove: (trackId: string | number, direction: -1 | 1) => void
  onRemove: (trackId: string | number) => void
}

// Simple wrapper so list semantics and styling stay centralized.
export default function PlaylistTrackList({ tracks, onMove, onRemove }: PlaylistTrackListProps) {
  return (
    <ul className="playlist-rows">
      {tracks.map((entry) => (
        <PlaylistTrackRow
          key={entry.track.trackId}
          entry={entry}
          onMove={onMove}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}

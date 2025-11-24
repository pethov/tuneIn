import '../../styles/playlist/PlaylistHeader.css'

interface PlaylistHeaderProps {
  title: string
  onPlayAll: () => void
}

// Lightweight header used on the Playlist page as well as list views.
export default function PlaylistHeader({ title, onPlayAll }: PlaylistHeaderProps) {
  return (
    <header className="playlist-header">
      <h1>{title}</h1>
      <div className="playlist-actions">
        <button onClick={onPlayAll}>Spill av</button>
      </div>
    </header>
  )
}

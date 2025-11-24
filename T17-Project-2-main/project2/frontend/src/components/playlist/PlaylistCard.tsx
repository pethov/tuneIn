import { Link } from 'react-router-dom'
import '../../styles/playlist/PlaylistCard.css'

export type PlaylistCardProps = {
  playlistId: string
  playlistName: string
  trackCount: number
  tracks?: { track: { artworkUrl100?: string | null } }[]
  asButton?: boolean
  onClick?: () => void
}

/** Grid/cover rendering logic */
function PlaylistCover({ tracks }: { tracks?: { track: { artworkUrl100?: string | null } }[] }) {
  const covers = (tracks ?? [])
    .map((t) => t.track.artworkUrl100)
    .filter(Boolean)
    .slice(0, 4)

  if (covers.length === 0) {
    return <figure className="playlist-cover placeholder" aria-hidden="true" />
  }

  if (covers.length < 4) {
    return <img src={covers[0]!} alt="" className="playlist-cover single" />
  }

  return (
    <figure className={`playlist-cover-grid covers-${covers.length}`}>
      {covers.map((src, i) => (
        <img key={i} src={src!} alt="" className="cover-img" />
      ))}
    </figure>
  )
}

/** Card that doubles as either a <Link> or <button> so both dashboard and admin views share markup. */
export default function PlaylistCard({
  playlistId,
  playlistName,
  trackCount,
  tracks,
  asButton = false,
  onClick,
}: PlaylistCardProps) {
  const content = (
    <>
      <PlaylistCover tracks={tracks} />
      <h3>{playlistName}</h3>
      <p className="tracks">
        {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
      </p>
    </>
  )

  // Option 1 – card as <Link> (for home page)
  if (!asButton) {
    return (
      <Link to={`/playlists/${playlistId}`} className="playlist-card">
        {content}
      </Link>
    )
  }

  // Option 2 – card as <button> (for playlist management page)
  return (
    <button type="button" onClick={onClick} className="playlist-card playlist-btn">
      {content}
    </button>
  )
}

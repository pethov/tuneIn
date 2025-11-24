import { Link } from 'react-router-dom'
import '../../styles/Navbar.css'
import { KEYS as SESSION_KEYS, writeJSON } from '../../lib/session'

// Desktop navigation bar that doubles as a “home” button by wiping any persisted SongSearch state.
export default function Navbar() {
  // Always show Playlists and link to the playlists page
  const buttonText = 'Playlists'
  const buttonRoute = '/playlists'

  const onLogoClick = () => {
    // Clear search term and selected filters in session storage and notify any
    // listening components to reset their UI state.
    try {
      writeJSON(SESSION_KEYS.term, '')
      writeJSON(SESSION_KEYS.artists, [])
      writeJSON(SESSION_KEYS.genres, [])
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('songsearch:reset'))
    }
  }

  return (
    <nav aria-label="Main navigation" className="thisNav">
      <section className="nav-inner">
        <h1 className="navTitle">
          <Link to="/" className="navLink" onClick={onLogoClick}>
            TuneIn
          </Link>
        </h1>
      </section>
      <h2 className="navAction">
        <Link to={buttonRoute} className="navActionLink">
          {buttonText}
        </Link>
      </h2>
    </nav>
  )
}

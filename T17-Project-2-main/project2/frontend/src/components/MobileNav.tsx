// Simple bottom navigation used on touch layouts; mirrors the desktop routes but strips
// away any context providers so we can mount/unmount it freely when breakpoints change.
import { NavLink } from 'react-router-dom'
import { FaHome, FaSearch, FaBook } from 'react-icons/fa'
import '../styles/mobileNav.css'

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      <NavLink to="/" className="mobile-nav-item">
        <FaHome />
        <span>Home</span>
      </NavLink>

      <NavLink to="/search" className="mobile-nav-item">
        <FaSearch />
        <span>Search</span>
      </NavLink>

      <NavLink to="/playlists" className="mobile-nav-item">
        <FaBook />
        <span>Library</span>
      </NavLink>
    </nav>
  )
}

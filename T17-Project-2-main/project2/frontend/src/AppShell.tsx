import { useEffect } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import Navbar from './components/play/Navbar'
import Home from './pages/Home'
import PlaylistsPage from './pages/PlaylistPage'
import Playlist from './components/playlist/Playlist'
import NowPlayingFooter from './components/play/NowPlayingFooter'
import MobileNav from './components/MobileNav'
import SongSearchPage from './pages/SongSearchPage'

export function Layout({ children }: { children: React.ReactNode }) {
  return <main style={{ maxWidth: 880, margin: '0 auto', padding: 16 }}>{children}</main>
}

// Top-level router + layout wrapper. Also wires up SPA-style click interception for static hosting setups.
export default function AppShell() {
  const navigate = useNavigate()
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '') || ''

  useEffect(() => {
    // Intercept in-app <a> clicks so the SPA can navigate without full reloads (helps on static hosting).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return

      let el = e.target as HTMLElement | null
      while (el && el.tagName !== 'A') el = el.parentElement
      const a = el as HTMLAnchorElement | null
      if (!a || !a.href) return

      if (a.target && a.target !== '_self') return
      if (a.hasAttribute('download')) return
      const url = new URL(a.href)
      if (url.origin !== window.location.origin) return

      const path = url.pathname
      if (base && !path.startsWith(base + '/') && path !== base) return

      e.preventDefault()
      const pathWithoutBase = base ? path.slice(base.length) || '/' : path
      navigate(pathWithoutBase + url.search + url.hash)
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navigate, base])

  return (
    <>
      <section className="app-shell">
        <Navbar></Navbar>
        <Routes>
          <Route
            path="/playlists"
            element={
              <Layout>
                <PlaylistsPage />
              </Layout>
            }
          />
          <Route
            path="/playlists/:id"
            element={
              <Layout>
                <Playlist />
              </Layout>
            }
          />
          <Route
            path="/search"
            element={
              <Layout>
                <SongSearchPage />
              </Layout>
            }
          />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </section>

      <NowPlayingFooter />
      <MobileNav />
    </>
  )
}

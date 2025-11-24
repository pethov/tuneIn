import { useQuery, useMutation } from '@apollo/client'
import { useState, useEffect, useRef } from 'react'
import SongSearch from '../components/songSearch/SongSearch'
import PlaylistCard from '../components/playlist/PlaylistCard'
import Toptracks from '../components/Toptracks'
import { Q_PLAYLISTS, M_CREATE } from '../graphql/playlist'
import { useIsMobile } from '../hooks/useIsMobile'
import '../styles/Home.css'
import { getRecentPlaylists } from '../lib/recentPlaylists'
import CreatePlaylistModal from '../components/playlist/CreatePlaylistModal'
import { FaPlus } from 'react-icons/fa'

type Playlist = {
  playlistId: string
  playlistName: string
  trackCount: number
  tracks: { track: { artworkUrl100?: string | null } }[]
}

// Landing page that stitches together search, top tracks, recents, and the create-playlist modal.
export default function Home() {
  const isMobile = useIsMobile()
  const { data, loading, error } = useQuery<{ playlists: Playlist[] }>(Q_PLAYLISTS)
  // Keep recent playlist ids in state so Home updates immediately when recents change
  const [recents, setRecents] = useState<string[]>(() => getRecentPlaylists())
  const [newPlName, setNewPlName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const createInputRef = useRef<HTMLInputElement | null>(null)
  const [createPlaylist, { loading: creating }] = useMutation(M_CREATE, {
    // Make sure new playlists appear immediately in any "Add to playlist" dropdowns.
    update(cache, { data }) {
      try {
        const created = data?.createPlaylist
        if (!created) return
        const existing = cache.readQuery<{ playlists: Playlist[] }>({ query: Q_PLAYLISTS })
        const next = (existing?.playlists ?? []).concat({
          playlistId: created.playlistId,
          playlistName: created.playlistName,
          trackCount: 0,
          tracks: [],
        })
        cache.writeQuery({ query: Q_PLAYLISTS, data: { playlists: next } })
      } catch {
        // ignore cache update issues
      }
    },
    onError: (err) => console.error('Create playlist error:', err),
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })

  useEffect(() => {
    const handler = () => setRecents(getRecentPlaylists())
    window.addEventListener('tunein:recent-playlists-changed', handler as EventListener)
    return () =>
      window.removeEventListener('tunein:recent-playlists-changed', handler as EventListener)
  }, [])

  const playlists = data?.playlists ?? []
  const hasPlaylists = playlists.length > 0

  return (
    <main className={`home-container ${isMobile ? 'mobile-home' : ''}`}>
      {/* --- MOBILE: Only Top Tracks --- */}
      {isMobile ? (
        <section className="home-toptracks">
          <header className="home-playlist-header">
            <h2>Top Tracks</h2>
          </header>
          <Toptracks limit={10} />
        </section>
      ) : (
        /* --- DESKTOP: Search + Top Tracks + Playlists --- */
        <>
          <section className="home-search">
            <SongSearch />
          </section>

          <section className="home-columns">
            <header className="home-left">
              <section className="home-toptracks">
                <header className="home-playlist-header">
                  <h2>Top Tracks</h2>
                </header>
                {loading && <p className="home-status-msg">Loading...</p>}
                {error && <p className="home-status-msg error">Failed to load top tracks.</p>}
                <Toptracks limit={10} />
              </section>
            </header>

            <section className="home-right">
              <section className="home-playlists">
                <header className="home-playlists-header">
                  <h2>Recent Interactions </h2>
                </header>

                {loading && <p className="home-status-msg">Loading...</p>}
                {error && hasPlaylists && (
                  <p className="home-status-msg error">Failed to load playlists.</p>
                )}

                {!loading && playlists.length === 0 ? (
                  <section className="home-empty-playlists">
                    <p className="home-empty-text">Make your first playlist</p>
                    <button
                      type="button"
                      className="playlist-create-btn"
                      onClick={() => {
                        setShowCreate(true)
                        requestAnimationFrame(() => createInputRef.current?.focus())
                      }}
                    >
                      <FaPlus aria-hidden="true" />
                      <span>New playlist</span>
                    </button>
                  </section>
                ) : (
                  <ul className="playlist-grid">
                    {(() => {
                      const all = playlists
                      const recentsFromState = recents
                      const ordered: Playlist[] = []
                      const used = new Set<string>()
                      // Add recents in order (most recent first)
                      for (const id of recentsFromState) {
                        const found = all.find((a) => a.playlistId === id)
                        if (found) {
                          ordered.push(found)
                          used.add(found.playlistId)
                        }
                        if (ordered.length >= 4) break
                      }
                      // Fill with other playlists as needed
                      for (const p of all) {
                        if (ordered.length >= 4) break
                        if (used.has(p.playlistId)) continue
                        ordered.push(p)
                      }
                      return ordered.map((p) => (
                        <li key={p.playlistId}>
                          <PlaylistCard
                            playlistId={p.playlistId}
                            playlistName={p.playlistName}
                            trackCount={p.trackCount}
                            tracks={p.tracks}
                          />
                        </li>
                      ))
                    })()}
                  </ul>
                )}
              </section>
            </section>
          </section>
        </>
      )}
      {/* Always mount the modal so state persists; visibility driven by `showCreate`. */}
      <CreatePlaylistModal
        show={showCreate}
        setShow={(val) => {
          setShowCreate(val)
          if (!val) setNewPlName('')
        }}
        newPlName={newPlName}
        setNewPlName={setNewPlName}
        inputRef={createInputRef}
        createPlaylist={createPlaylist}
        creatingPl={creating}
        existingNames={playlists.map((p) => p.playlistName)}
      />
    </main>
  )
}

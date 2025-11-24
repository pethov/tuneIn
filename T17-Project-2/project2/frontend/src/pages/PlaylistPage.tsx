import { useRef, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useNavigate } from 'react-router-dom'
import PlaylistCard from '../components/playlist/PlaylistCard'
import { Q_PLAYLISTS, M_CREATE } from '../graphql/playlist'
import '../styles/playlist/playlistPage.css'
import PlaylistSearch from '../components/playlist/PlaylistSearch'
import CreatePlaylistModal from '../components/playlist/CreatePlaylistModal'
import { FaPlus } from 'react-icons/fa'
import { getPlaylistLastPlayedMap } from '../lib/recentPlaylists'

const __LS_KEY = 'tunein_playlist_created_map'
type __CreatedMap = { [id: string]: string }
function getCreatedMap(): __CreatedMap {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {}
    const raw = localStorage.getItem(__LS_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return {}
    return obj as __CreatedMap
  } catch {
    return {}
  }
}

type Playlist = {
  playlistId: string
  playlistName: string
  trackCount: number
  tracks: { track: { artworkUrl100?: string | null } }[]
}

// Dedicated “Your playlists” page with search/sort controls and bulk creation support.
export default function PlaylistsPage() {
  const { data, loading, error } = useQuery<{ playlists: Playlist[] }>(Q_PLAYLISTS)
  const [createPlaylist, { loading: creating }] = useMutation(M_CREATE, {
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
        // ignore cache update errors
      }
    },
    onError: (err) => console.error('Create playlist error:', err),
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })
  const playlists = data?.playlists ?? []
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const createInputRef = useRef<HTMLInputElement | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<'played' | 'alpha'>('played')
  const navigate = useNavigate()

  const showLoading = loading && playlists.length > 0
  const showError = error && playlists.length > 0

  return (
    <section className="playlists-page">
      <header className="playlists-header">
        <h2 className="page-title">Your Playlists</h2>
        <section className="playlist-actions">
          <section className="playlist-actions-left">
            <button
              type="button"
              className="playlist-create-btn"
              onClick={() => {
                setShowCreate(true)
              }}
            >
              <FaPlus aria-hidden="true" />
              <span>New playlist</span>
            </button>
            <PlaylistSearch
              open={searchOpen}
              term={searchTerm}
              onToggle={() =>
                setSearchOpen((prev) => {
                  if (prev) setSearchTerm('')
                  return !prev
                })
              }
              onChange={(val) => setSearchTerm(val)}
            />
          </section>
          <label className="playlist-sort-control">
            <span>Sort</span>
            <select
              className="playlist-sort-select"
              value={sortMode}
              aria-label="Sort playlists"
              onChange={(e) => setSortMode(e.target.value as 'played' | 'alpha')}
            >
              <option value="played">Recent</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </label>
        </section>
      </header>

      {showLoading && <p className="status-msg">Loading…</p>}
      {showError && <p className="status-msg error">Failed to load playlists.</p>}

      <ul className="playlist-grid-page">
        {(() => {
          // Normalize playlists by creation time + search term, then apply the selected sort order.
          const all = playlists
          const createdMap = getCreatedMap()
          const playedMap = getPlaylistLastPlayedMap()

          const withCreated: Playlist[] = []
          const withoutCreated: Playlist[] = []

          for (const p of all) {
            if (createdMap[p.playlistId]) withCreated.push(p)
            else withoutCreated.push(p)
          }

          withCreated.sort((a, b) => {
            const ta = Date.parse(createdMap[a.playlistId])
            const tb = Date.parse(createdMap[b.playlistId])
            return tb - ta // newest first
          })

          const ordered = [...withCreated, ...withoutCreated]
          const query = searchTerm.trim().toLowerCase()
          const filtered = query
            ? ordered.filter((p) => p.playlistName.toLowerCase().includes(query))
            : ordered

          const display = [...filtered]
          if (sortMode === 'alpha') {
            display.sort((a, b) =>
              a.playlistName.localeCompare(b.playlistName, undefined, { sensitivity: 'base' })
            )
          } else if (sortMode === 'played') {
            const playedValue = (id: string) => {
              const raw = playedMap[id]
              const parsed = raw ? Date.parse(raw) : 0
              return Number.isNaN(parsed) ? 0 : parsed
            }
            display.sort((a, b) => playedValue(b.playlistId) - playedValue(a.playlistId))
          }

          if (display.length === 0) {
            return (
              <li className="playlist-grid-empty status-msg" role="status">
                {query ? 'No playlists matched your search.' : 'No playlists yet.'}
              </li>
            )
          }

          return display.map((p) => (
            <li key={p.playlistId}>
              <PlaylistCard
                onClick={() => navigate(`/playlists/${p.playlistId}`)}
                playlistId={p.playlistId}
                playlistName={p.playlistName}
                trackCount={p.trackCount}
                tracks={p.tracks}
              />
            </li>
          ))
        })()}
      </ul>
      {/* Always render the modal so we keep focus + validation state between opens. */}
      <CreatePlaylistModal
        show={showCreate}
        setShow={(val) => {
          setShowCreate(val)
          if (!val) setName('')
        }}
        newPlName={name}
        setNewPlName={setName}
        inputRef={createInputRef}
        createPlaylist={createPlaylist}
        creatingPl={creating}
        existingNames={playlists.map((p) => p.playlistName)}
      />
    </section>
  )
}

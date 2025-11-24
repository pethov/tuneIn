import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/playlist/addPlaylistModal.css'
import { FaPlus, FaCheck } from 'react-icons/fa'
import type { Track } from '../../types'
import type { MutationFunction } from '@apollo/client'

type PlaylistTrackEntry = {
  track?: Partial<Track> | null
}

type Playlist = {
  playlistId: string
  playlistName: string
  tracks?: PlaylistTrackEntry[] | null
}

type AddToPlaylistMutation = MutationFunction<unknown, Record<string, unknown>>

type Props = {
  dropdownRef: React.RefObject<HTMLDivElement | null>
  positionMode?: 'fixed' | 'anchored'
  anchorRect?: DOMRect | null
  track: Track
  playlists: Playlist[] | undefined
  addToPlaylist: AddToPlaylistMutation
  markJustAdded: (id: string) => void
  setOpenAddFor: React.Dispatch<React.SetStateAction<string | null>>
  setShowCreatePl: (v: boolean) => void
  setPendingAddTrack: (t: Track | null) => void
  playing?: boolean
  queueSource?: string | null
  appendToQueue?: (items: Track[], source?: string) => void
}

// Small floating portal that lets the user drop a track into any playlist or create a new one.
export default function AddPlaylistModal({
  dropdownRef,
  positionMode = 'fixed',
  anchorRect,
  track,
  playlists,
  addToPlaylist,
  markJustAdded,
  setOpenAddFor,
  setShowCreatePl,
  setPendingAddTrack,
  playing,
  queueSource,
  appendToQueue,
}: Props) {
  const resolvedTrackId = String(track.trackId ?? track.id ?? '')
  const trackKeyLocal = String(resolvedTrackId)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setSearchQuery('')
  }, [trackKeyLocal])

  const orderedPlaylists = useMemo(() => {
    // Remember recently created playlists in localStorage so they float to the top.
    const all = playlists ?? []
    const KEY = 'tunein_playlist_created_map'
    let createdMap: Record<string, string> = {}
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object') createdMap = parsed
        }
      }
    } catch {
      // ignore storage errors
    }

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

    return [...withCreated, ...withoutCreated]
  }, [playlists])

  const filteredPlaylists = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return orderedPlaylists
    return orderedPlaylists.filter((p) => p.playlistName.toLowerCase().includes(query))
  }, [orderedPlaylists, searchQuery])

  useEffect(() => {
    // When the dropdown is anchored we emulate Popper.js behaviour via CSS variables.
    if (positionMode !== 'anchored') return
    if (typeof document === 'undefined') return
    if (!anchorRect) return

    const dropdownWidth = 200
    const gap = 8
    const left = Math.max(
      gap,
      Math.round(anchorRect.left + window.scrollX + anchorRect.width - dropdownWidth - gap)
    )
    const top = Math.max(gap, Math.round(anchorRect.top + window.scrollY))

    const docEl = document.documentElement
    docEl.style.setProperty('--songsearch-dd-left', `${left}px`)
    docEl.style.setProperty('--songsearch-dd-top', `${top}px`)
    docEl.style.setProperty('--songsearch-dd-width', `${dropdownWidth}px`)

    return () => {
      docEl.style.removeProperty('--songsearch-dd-left')
      docEl.style.removeProperty('--songsearch-dd-top')
      docEl.style.removeProperty('--songsearch-dd-width')
    }
  }, [anchorRect, positionMode])

  if (typeof document === 'undefined') return null
  if (positionMode === 'anchored' && !anchorRect) return null

  return createPortal(
    <aside
      role="dialog"
      aria-label="Add to playlist"
      className={`songsearch-dropdown-portal songsearch-dropdown filter-popup playlist-popup${
        positionMode === 'anchored' ? ' anchored-dropdown' : ''
      }`}
      onMouseDown={(e) => e.stopPropagation()}
      ref={dropdownRef}
    >
      <header className="songsearch-dropdown-header">
        <h2 className="sr-only">Add to playlist</h2>
        <strong>Add to playlist</strong>
        <button
          type="button"
          className="songsearch-dropdown-close"
          aria-label="Close add to playlist"
          onClick={() => setOpenAddFor(null)}
        >
          x
        </button>
      </header>

      <input
        type="search"
        className="popup-input playlist-search-input"
        placeholder="Search playlists"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
      />

      <ul className="popup-list playlist-popup-list" role="listbox" aria-label="Playlists">
        {filteredPlaylists.length === 0 && (
          <li className="songsearch-dropdown-empty">
            {orderedPlaylists.length === 0
              ? 'No playlists found'
              : 'No playlists match your search'}
          </li>
        )}

        {filteredPlaylists.map((p) => {
          const existingIds = new Set<string>()
          try {
            p.tracks?.forEach((pt) => {
              const id = pt?.track?.trackId ?? pt?.track?.id
              if (id != null) existingIds.add(String(id))
            })
          } catch {
            // ignore malformed playlist entries
          }
          // Disable the action if the track already exists so the user understands why nothing happens.
          const alreadyPresent = resolvedTrackId && existingIds.has(resolvedTrackId)

          return (
            <li key={p.playlistId}>
              <button
                type="button"
                className={`popup-item songsearch-dropdown-item ${
                  alreadyPresent ? 'already-added' : ''
                }`}
                title={alreadyPresent ? 'Already added to playlist' : undefined}
                aria-disabled={alreadyPresent ? 'true' : undefined}
                onClick={async (ev) => {
                  ev.stopPropagation()
                  if (alreadyPresent) {
                    setOpenAddFor(null)
                    return
                  }
                  try {
                    await addToPlaylist({
                      variables: {
                        input: { playlistId: p.playlistId, trackId: Number(resolvedTrackId) },
                      },
                    })
                    markJustAdded(trackKeyLocal)
                    setOpenAddFor(null)

                    try {
                      if (playing && queueSource === `playlist:${p.playlistId}` && appendToQueue) {
                        const nextTrack: Track = {
                          ...track,
                          trackId: Number(resolvedTrackId),
                        }
                        appendToQueue([nextTrack], `playlist:${p.playlistId}`)
                      }
                    } catch {
                      // ignore append errors
                    }
                  } catch {
                    // mutation has own onError handler, keep UI simple
                  }
                }}
              >
                <span className="item-label">{p.playlistName}</span>
                {alreadyPresent && (
                  <span className="check" aria-hidden="true">
                    <FaCheck />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <footer className="playlist-popup-footer">
        <button
          type="button"
          className="songsearch-dropdown-new-playlist"
          aria-label="Make new playlist"
          onClick={() => {
            setPendingAddTrack(track)
            setShowCreatePl(true)
            setOpenAddFor(null)
          }}
        >
          <FaPlus /> New Playlist
        </button>
      </footer>
    </aside>,
    document.body
  )
}

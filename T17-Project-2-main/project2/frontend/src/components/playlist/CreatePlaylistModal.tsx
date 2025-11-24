import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import '../../styles/playlist/createPlaylistModal.css'
import type { Track } from '../../types'
import type { MutationFunction } from '@apollo/client'
import { markPlaylistPlayed } from '../../lib/recentPlaylists'

type UnknownMutation = MutationFunction<unknown, Record<string, unknown>>

type CreatePlaylistPayload = {
  createPlaylist?: {
    playlistId?: string | number | null
  } | null
}

type Props = {
  show: boolean
  setShow: (v: boolean) => void
  newPlName: string
  setNewPlName: (s: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  createPlaylist: UnknownMutation
  addToPlaylist?: UnknownMutation
  pendingAddTrack?: Track | null
  setPendingAddTrack?: (t: Track | null) => void
  markJustAdded?: (id: string) => void
  creatingPl?: boolean
  existingNames?: string[]
}

// Modal that creates a playlist and optionally queues a follow-up add-to-playlist mutation.
export default function CreatePlaylistModal({
  show,
  setShow,
  newPlName,
  setNewPlName,
  inputRef,
  createPlaylist,
  addToPlaylist,
  pendingAddTrack,
  setPendingAddTrack,
  markJustAdded,
  creatingPl,
  existingNames = [],
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const normalizedExistingNames = useMemo(() => {
    // Deduplicate inputs so form validation can spot conflicts quickly.
    return new Set(
      existingNames.map((n) => n?.trim().toLowerCase()).filter((n): n is string => Boolean(n))
    )
  }, [existingNames])

  useEffect(() => {
    if (show) setError(null)
  }, [show])

  const handleError = (e: unknown) => {
    // Translate backend error messages into a friendlier set of hints.
    const fallback = 'Could not create playlist. Please try again.'
    if (e instanceof Error && e.message) {
      const cleaned = e.message.replace(/^Failed to create playlist:\s*/i, '').trim()
      const lower = cleaned.toLowerCase()
      if (lower.includes('duplicate') || lower.includes('already exists')) {
        setError('A playlist with this name already exists. Try another name.')
      } else if (lower.includes('name is required') || lower.includes('name required')) {
        setError('Please enter a playlist name.')
      } else {
        setError(cleaned || fallback)
      }
    } else {
      setError(fallback)
    }
    inputRef.current?.focus()
  }

  const hasDocument = typeof document !== 'undefined'
  if (!show || !hasDocument) return null

  return createPortal(
    <section
      className="songsearch-modal-backdrop"
      role="presentation"
      onMouseDown={() => setShow(false)}
    >
      <section
        className="songsearch-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-pl-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="songsearch-modal-header">
          <h3 id="new-pl-title">New playlist</h3>
        </header>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const name = newPlName.trim()
            if (!name) {
              setError('Please enter a playlist name.')
              inputRef.current?.focus()
              return
            }

            if (normalizedExistingNames.has(name.toLowerCase())) {
              setError('A playlist with this name already exists. Try another name.')
              inputRef.current?.focus()
              return
            }
            try {
              const res = await createPlaylist({ variables: { name } })
              setError(null)
              const createdId = (res?.data as CreatePlaylistPayload | undefined)?.createPlaylist
                ?.playlistId
              // Record creation time in localStorage so other UI (like dropdowns)
              // can order playlists by when they were created. Uses the same
              // storage format as PlaylistsPage.
              try {
                if (createdId && typeof window !== 'undefined' && window.localStorage) {
                  const KEY = 'tunein_playlist_created_map'
                  const raw = localStorage.getItem(KEY)
                  let map: { [k: string]: string } = {}
                  if (raw) {
                    try {
                      const parsed = JSON.parse(raw)
                      if (parsed && typeof parsed === 'object') map = parsed
                    } catch {
                      // ignore parse errors
                    }
                  }
                  map[String(createdId)] = new Date().toISOString()
                  try {
                    localStorage.setItem(KEY, JSON.stringify(map))
                  } catch {
                    // ignore storage set errors
                  }
                }
              } catch {
                // ignore any localStorage errors
              }
              if (createdId) {
                markPlaylistPlayed(String(createdId))
              }
              if (createdId && pendingAddTrack && addToPlaylist) {
                try {
                  const resolvedTrackId = pendingAddTrack.trackId ?? pendingAddTrack.id
                  await addToPlaylist({
                    variables: { input: { playlistId: createdId, trackId: resolvedTrackId } },
                  })
                  markJustAdded?.(String(resolvedTrackId))
                } catch {
                  // ignore add errors
                }
              }
              if (!createdId) {
                handleError(new Error('Could not create playlist. Please try again.'))
                return
              }
              setNewPlName('')
              setError(null)
              setShow(false)
              setPendingAddTrack?.(null)
            } catch (err) {
              try {
                setError((err as Error)?.message ? `Feil: ${(err as Error).message}` : 'Feil')
              } catch {
                setError('Feil')
              }
            }
          }}
        >
          <input
            ref={inputRef}
            type="text"
            className="songsearch-modal-input"
            placeholder="New playlist name"
            value={newPlName}
            onChange={(e) => {
              setNewPlName(e.target.value)
              if (error) setError(null)
            }}
            aria-label="New playlist name"
          />
          {error && (
            <p className="songsearch-modal-error" role="alert">
              {error}
            </p>
          )}
          <footer className="songsearch-modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setShow(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creatingPl}>
              {creatingPl ? 'Creating...' : 'Create'}
            </button>
          </footer>
        </form>
      </section>
    </section>,
    document.body
  )
}

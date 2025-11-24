import React, { useCallback, useEffect, useRef } from 'react'
import { FaPlus, FaCheck } from 'react-icons/fa'
import AddPlaylistModal from '../playlist/AddPlaylistModal'
import type { Track } from '../../types'
import type { MutationFunction } from '@apollo/client'

type Playlist = { playlistId: string; playlistName: string }

type AddToPlaylistMutation = MutationFunction<unknown, Record<string, unknown>>

type Props = {
  track: Track
  wasJustAdded: boolean
  openAddFor: string | null
  setOpenAddFor: React.Dispatch<React.SetStateAction<string | null>>
  anchorRect: DOMRect | null
  setAnchorRect: React.Dispatch<React.SetStateAction<DOMRect | null>>
  dropdownRef: React.RefObject<HTMLDivElement | null>
  playlistsData: { playlists: Playlist[] } | undefined
  addToPlaylist: AddToPlaylistMutation
  markJustAdded: (id: string) => void
  setShowCreatePl: (v: boolean) => void
  setPendingAddTrack: (t: Track | null) => void
  playing?: boolean
  queueSource?: string | null
  appendToQueue?: (items: Track[], source?: string) => void
}

// Wraps AddPlaylistModal with the trigger button that lives inside each search result row.
export default function AddButton({
  track,
  wasJustAdded,
  openAddFor,
  setOpenAddFor,
  dropdownRef,
  playlistsData,
  addToPlaylist,
  markJustAdded,
  setShowCreatePl,
  setPendingAddTrack,
  setAnchorRect,
  anchorRect,
  playing,
  queueSource,
  appendToQueue,
}: Props) {
  const id = String(track.trackId ?? track.id ?? '')
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const updateAnchorRect = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return

    const btnRect = btn.getBoundingClientRect()
    const row = btn.closest('.track-row') as HTMLElement | null
    const rowRect = row?.getBoundingClientRect() ?? btnRect

    const mergedRect =
      typeof DOMRect !== 'undefined'
        ? new DOMRect(btnRect.left, rowRect.top, btnRect.width, rowRect.height ?? btnRect.height)
        : (btnRect as DOMRect)
    setAnchorRect(mergedRect)

    if (typeof document !== 'undefined') {
      const dropdownWidth = 200
      const gap = 8
      const left = Math.max(
        gap,
        Math.round(btnRect.left + window.scrollX + btnRect.width - dropdownWidth - gap)
      )
      const top = Math.max(gap, Math.round(rowRect.top + window.scrollY))
      document.documentElement.style.setProperty('--songsearch-dd-left', `${left}px`)
      document.documentElement.style.setProperty('--songsearch-dd-top', `${top}px`)
      document.documentElement.style.setProperty('--songsearch-dd-width', `${dropdownWidth}px`)
    }
  }, [setAnchorRect])

  useEffect(() => {
    // Recalculate the anchored dropdown position when the viewport changes.
    if (openAddFor !== id) return

    const handleReposition = () => updateAnchorRect()
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    handleReposition()
    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [id, openAddFor, updateAnchorRect])

  return (
    <aside className="track-row-right" aria-hidden={false}>
      <button
        type="button"
        className="playlist-remove-btn"
        ref={btnRef}
        aria-label={
          wasJustAdded ? `Added ${track.trackName}` : `Add ${track.trackName} to playlist`
        }
        disabled={wasJustAdded}
        onClick={(e) => {
          e.stopPropagation()
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('songsearch:close-filters'))
          }
          updateAnchorRect()
          setOpenAddFor((prev) => (prev === id ? null : id))
        }}
      >
        {wasJustAdded ? <FaCheck /> : <FaPlus />}
      </button>

      {openAddFor === id && (
        <AddPlaylistModal
          dropdownRef={dropdownRef}
          track={track}
          playlists={playlistsData?.playlists}
          addToPlaylist={addToPlaylist}
          markJustAdded={markJustAdded}
          setOpenAddFor={setOpenAddFor}
          setShowCreatePl={setShowCreatePl}
          setPendingAddTrack={setPendingAddTrack}
          anchorRect={anchorRect}
          playing={playing}
          queueSource={queueSource}
          appendToQueue={appendToQueue}
          positionMode="anchored"
        />
      )}
    </aside>
  )
}

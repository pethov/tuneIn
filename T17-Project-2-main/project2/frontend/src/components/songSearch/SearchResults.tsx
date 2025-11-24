import React from 'react'
import { FaPlay, FaPause } from 'react-icons/fa'
import { usePlayer } from '../../player/PlayerContext'
import '../../styles/songSearch/searchResults.css'
import type { MutationFunction } from '@apollo/client'
import AddButton from './AddButton'
import type { Track } from '../../types'
import { ellipsizeEnd } from '../../hooks/useTruncationLimits'

type Playlist = { playlistId: string; playlistName: string }
type AddToPlaylistMutation = MutationFunction<unknown, Record<string, unknown>>

type Props = {
  items: Track[]
  loading: boolean
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
  openPlayerAt: (i: number) => void
  playing?: boolean
  queueSource?: string | null
  appendToQueue?: (items: Track[], source?: string) => void
  justAddedIds: Set<string>
  truncateLimits: { title: number; artist: number }
}

// Stateless renderer for the search hits list. Parent components feed it queue helpers and playlist data.
export default function SearchResults({
  items,
  loading,
  openAddFor,
  setOpenAddFor,
  anchorRect,
  setAnchorRect,
  dropdownRef,
  playlistsData,
  addToPlaylist,
  markJustAdded,
  setShowCreatePl,
  setPendingAddTrack,
  openPlayerAt,
  playing,
  queueSource,
  appendToQueue,
  justAddedIds,
  truncateLimits,
}: Props) {
  // The footer owns playback state, but we subscribe here to mirror the “playing” indicator.
  const { queue, index, playing: playerPlaying } = usePlayer()
  return (
    <ul
      aria-label="Søkeresultater"
      aria-busy={loading ? 'true' : 'false'}
      className="search-results-list"
    >
      {items.map((t, i) => {
        // Song search merges API responses with locally created playlists, so track ids may vary.
        const trackKey = String(t.trackId ?? t.id ?? '')
        const wasJustAdded = justAddedIds.has(trackKey)

        return (
          <li key={t.trackId}>
            <article className="track-row" aria-label={`Track ${t.trackName}`}>
              <button
                type="button"
                onClick={() => openPlayerAt(i)}
                aria-haspopup="dialog"
                aria-label={`Play ${t.trackName} by ${t.artistName}`}
                className="track-row-btn"
              >
                <span className="artwork-wrap">
                  <img
                    src={t.artworkUrl100 || '/placeholder.png'}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    className="playlist-artwork"
                  />
                  <span className="artwork-overlay" aria-hidden="true">
                    {queue.length > 0 &&
                    queue[index] &&
                    queue[index].trackId === t.trackId &&
                    playerPlaying ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )}
                  </span>
                </span>

                <article className="track-row-text">
                  <h3 className="track-row-title" title={t.trackName || undefined}>
                    {ellipsizeEnd(t.trackName, truncateLimits.title)}
                  </h3>
                  <p
                    className="track-row-artist"
                    title={t.artistName || (t.collectionName ?? undefined)}
                  >
                    {ellipsizeEnd(
                      t.artistName,
                      Math.max(20, Math.round(truncateLimits.artist * 0.65))
                    )}
                  </p>
                  {t.collectionName && (
                    <p className="track-row-collection" title={t.collectionName}>
                      {ellipsizeEnd(
                        t.collectionName,
                        Math.max(20, Math.round(truncateLimits.artist * 0.65))
                      )}
                    </p>
                  )}
                </article>
              </button>

              <AddButton
                track={t}
                wasJustAdded={wasJustAdded}
                openAddFor={openAddFor}
                setOpenAddFor={setOpenAddFor}
                anchorRect={anchorRect}
                setAnchorRect={setAnchorRect}
                dropdownRef={dropdownRef}
                playlistsData={playlistsData}
                addToPlaylist={addToPlaylist}
                markJustAdded={markJustAdded}
                setShowCreatePl={setShowCreatePl}
                setPendingAddTrack={setPendingAddTrack}
                playing={playing}
                queueSource={queueSource}
                appendToQueue={appendToQueue}
              />
            </article>
          </li>
        )
      })}
    </ul>
  )
}

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React, { useState } from 'react'

import AddButton from '../songSearch/AddButton'

describe('AddButton', () => {
  it('toggles openAddFor and renders AddPlaylistModal when opened', () => {
    const track = { trackId: 1, trackName: 'My Song' }
    const dropdownRef = { current: null } as React.RefObject<HTMLDivElement | null>
    const playlistsData = { playlists: [] }

    function Wrapper() {
      const [openAddFor, setOpenAddFor] = useState<string | null>(null)
      const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
      return (
        <div>
          <div className="track-row" />
          <AddButton
            track={track as any}
            wasJustAdded={false}
            openAddFor={openAddFor}
            setOpenAddFor={setOpenAddFor}
            anchorRect={anchorRect}
            setAnchorRect={setAnchorRect}
            dropdownRef={dropdownRef}
            playlistsData={playlistsData}
            addToPlaylist={vi.fn() as any}
            markJustAdded={vi.fn()}
            setShowCreatePl={vi.fn()}
            setPendingAddTrack={vi.fn()}
            playing={false}
            queueSource={null}
            appendToQueue={vi.fn()}
          />
        </div>
      )
    }

    render(<Wrapper />)

    const btn = screen.getByRole('button', { name: /Add My Song to playlist/i })
    // simulate click
    fireEvent.click(btn)

    // After click the portal AddPlaylistModal should render into document.body
    const modal = screen.getByRole('dialog', { name: /Add to playlist/i })
    expect(modal.textContent).toMatch(/Add to playlist/i)
  })
})

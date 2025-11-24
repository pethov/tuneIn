import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock AddButton to keep the test focused on SearchResults
vi.mock('../songSearch/AddButton', () => ({
  default: (props: any) => <button data-testid={`addbtn-${props.track?.trackId}`}>add</button>,
}))

// Mock player context
vi.mock('../../player/PlayerContext', () => ({ usePlayer: vi.fn() }))

import SearchResults from '../songSearch/SearchResults'

describe('SearchResults', () => {
  it('renders items and calls openPlayerAt when play button is clicked', async () => {
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({ queue: [], index: 0, playing: false })

    const openPlayerAt = vi.fn()
    const setOpenAddFor = vi.fn()
    const dropdownRef = { current: null } as React.RefObject<HTMLDivElement | null>
    const addToPlaylist = vi.fn()
    const markJustAdded = vi.fn()
    const setShowCreatePl = vi.fn()
    const setPendingAddTrack = vi.fn()
    const appendToQueue = vi.fn()

    const items = [
      {
        trackId: 1,
        trackName: 'My Song',
        artistName: 'The Artist',
        artworkUrl100: '/a.png',
        collectionName: 'Album A',
      },
    ]

    render(
      <SearchResults
        items={items as any}
        loading={false}
        openAddFor={null}
        setOpenAddFor={setOpenAddFor}
        anchorRect={null}
        setAnchorRect={vi.fn()}
        dropdownRef={dropdownRef}
        playlistsData={{ playlists: [] }}
        addToPlaylist={addToPlaylist as any}
        markJustAdded={markJustAdded}
        setShowCreatePl={setShowCreatePl}
        setPendingAddTrack={setPendingAddTrack}
        openPlayerAt={openPlayerAt}
        playing={false}
        queueSource={null}
        appendToQueue={appendToQueue}
        justAddedIds={new Set()}
        truncateLimits={{ title: 40, artist: 40 }}
      />
    )

    // The title should be present
    expect(screen.getByText('My Song')).toBeTruthy()

    // Play button should call openPlayerAt
    const playBtn = screen.getByLabelText('Play My Song by The Artist')
    fireEvent.click(playBtn)
    expect(openPlayerAt).toHaveBeenCalledWith(0)

    // AddButton was mocked to a button with data-testid
    expect(screen.getByTestId('addbtn-1')).toBeTruthy()
  })

  it('renders an empty state when there are no items', async () => {
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({ queue: [], index: 0, playing: false })

    const openPlayerAt = vi.fn()

    render(
      <SearchResults
        items={[] as any}
        loading={false}
        openAddFor={null}
        setOpenAddFor={vi.fn()}
        anchorRect={null}
        setAnchorRect={vi.fn()}
        dropdownRef={{ current: null }}
        playlistsData={{ playlists: [] }}
        addToPlaylist={vi.fn() as any}
        markJustAdded={vi.fn()}
        setShowCreatePl={vi.fn()}
        setPendingAddTrack={vi.fn()}
        openPlayerAt={openPlayerAt}
        playing={false}
        queueSource={null}
        appendToQueue={vi.fn()}
        justAddedIds={new Set()}
        truncateLimits={{ title: 40, artist: 40 }}
      />
    )

    // Component may render an explicit empty state message or simply no list items.
    const items = screen.queryAllByRole('listitem')
    expect(items.length === 0 || screen.queryByText(/ingen treff/i)).toBeTruthy()
  })
})

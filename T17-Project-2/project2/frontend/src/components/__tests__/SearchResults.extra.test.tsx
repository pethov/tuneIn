import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock AddButton to expose wasJustAdded prop as data attribute
vi.mock('../songSearch/AddButton', () => ({
  default: (props: any) => (
    <div data-testid={`add-${props.track?.trackId}`} data-was={String(props.wasJustAdded)} />
  ),
}))

vi.mock('../../player/PlayerContext', () => ({ usePlayer: vi.fn() }))

import SearchResults from '../songSearch/SearchResults'

describe('SearchResults extra cases', () => {
  it('sets aria-busy when loading and renders multiple items', async () => {
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({ queue: [], index: 0, playing: false })

    const openPlayerAt = vi.fn()

    const items = [
      { trackId: 1, trackName: 'A', artistName: 'X', artworkUrl100: '/a.png' },
      { trackId: 2, trackName: 'B', artistName: 'Y', artworkUrl100: '/b.png' },
    ]

    render(
      <SearchResults
        items={items as any}
        loading={true}
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

    const list = screen.getByRole('list', { name: /søkeresultater/i })
    expect(list.getAttribute('aria-busy')).toBe('true')
    // two items rendered
    const lis = screen.getAllByRole('listitem')
    expect(lis.length).toBe(2)
  })

  it('does not crash when there are no playlists and no items', async () => {
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({ queue: [], index: 0, playing: false })

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
        openPlayerAt={vi.fn()}
        playing={false}
        queueSource={null}
        appendToQueue={vi.fn()}
        justAddedIds={new Set()}
        truncateLimits={{ title: 40, artist: 40 }}
      />
    )

    // No list items and no AddButton instances should be present
    expect(screen.queryAllByRole('listitem').length).toBe(0)
    expect(screen.queryAllByTestId(/add-/i).length).toBe(0)
  })

  it('passes wasJustAdded when id is in justAddedIds', async () => {
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({ queue: [], index: 0, playing: false })

    const openPlayerAt = vi.fn()

    const items = [{ trackId: 1, trackName: 'A', artistName: 'X', artworkUrl100: '/a.png' }]

    render(
      <SearchResults
        items={items as any}
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
        justAddedIds={new Set(['1'])}
        truncateLimits={{ title: 40, artist: 40 }}
      />
    )

    const adds = screen.getAllByTestId('add-1')
    // There may be multiple rendered lists across renders; ensure at least one indicates just-added
    expect(adds.some((n: any) => n.dataset.was === 'true')).toBe(true)
  })

  it('renders a large list of results without crashing', async () => {
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({ queue: [], index: 0, playing: false })

    const items = Array.from({ length: 200 }, (_, i) => ({
      trackId: i + 1,
      trackName: `Track ${i + 1}`,
      artistName: `Artist ${i + 1}`,
      artworkUrl100: '/a.png',
    }))

    render(
      <SearchResults
        items={items as any}
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
        openPlayerAt={vi.fn()}
        playing={false}
        queueSource={null}
        appendToQueue={vi.fn()}
        justAddedIds={new Set()}
        truncateLimits={{ title: 40, artist: 40 }}
      />
    )

    const lis = screen.getAllByRole('listitem')
    expect(lis.length).toBe(200)
  })
})

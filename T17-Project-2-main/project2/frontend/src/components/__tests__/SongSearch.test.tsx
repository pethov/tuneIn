import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SongSearch from '../songSearch/SongSearch'
import { PlayerProvider } from '../../player/PlayerContext'

// Mock graphqlFetch used by runSearch
vi.mock('../../lib/graphqlFetch', () => ({ graphqlFetch: vi.fn() }))
// Mock debounced hook to return value immediately
vi.mock('../../hooks/useDebouncedValue', () => ({ useDebouncedValue: (v: any) => v }))
// Mock Apollo hooks used for playlists and mutation
vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<any>('@apollo/client')
  return {
    ...actual,
    useQuery: () => ({ data: { playlists: [] } }),
    useMutation: () => [vi.fn(), {}],
  }
})

import { graphqlFetch } from '../../lib/graphqlFetch'

const sample = {
  searchTracks: {
    total: 2,
    items: [
      { trackId: 11, trackName: 'One', artistName: 'A', artworkUrl100: '/a.png' },
      { trackId: 22, trackName: 'Two', artistName: 'B', artworkUrl100: '/b.png' },
    ],
  },
}

describe('SongSearch', () => {
  beforeEach(() => {
    ;(graphqlFetch as any).mockReset()
    ;(graphqlFetch as any).mockResolvedValue(sample)
  })

  it('runs a search when typing and displays results', async () => {
    render(
      <PlayerProvider>
        <SongSearch />
      </PlayerProvider>
    )

    const input = screen.getByLabelText('Søkefelt') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'ab' } })

    // results should appear
    expect(await screen.findByText('One')).toBeTruthy()
    expect(await screen.findByText('Two')).toBeTruthy()
  })

  it('handles empty results without crashing', async () => {
    ;(graphqlFetch as any).mockResolvedValue({
      searchTracks: { total: 0, items: [] },
    })

    render(
      <PlayerProvider>
        <SongSearch />
      </PlayerProvider>
    )

    const input = screen.getByLabelText('Søkefelt') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'nohits' } })

    // Should not render previous results; UI may show an empty state or nothing.
    // Important part is that nothing throws and no sample titles are visible.
    expect(await screen.queryByText('One')).toBeNull()
    expect(await screen.queryByText('Two')).toBeNull()
  })

  it('shows an error message when search fails', async () => {
    ;(graphqlFetch as any).mockRejectedValue(new Error('Network fail'))

    render(
      <PlayerProvider>
        <SongSearch />
      </PlayerProvider>
    )

    const input = screen.getByLabelText('Søkefelt') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'err' } })

    // Depending on implementation the component might surface a generic error text.
    // Assert that some error indication is rendered.
    const errorNode = await screen.findByText(/feil/i)
    expect(errorNode).toBeTruthy()
  })
})

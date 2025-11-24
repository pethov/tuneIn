import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { PlayerProvider } from '../../player/PlayerContext'
import { MockedProvider } from '@apollo/client/testing'
import { Q_PLAYLISTS } from '../../graphql/playlist'

// Mock graphqlFetch before importing the component
vi.mock('../../lib/graphqlFetch', () => ({
  graphqlFetch: vi.fn(),
}))

import { graphqlFetch } from '../../lib/graphqlFetch'
import Toptracks from '../Toptracks'

const sampleTracks = [
  {
    trackId: 1,
    trackName: 'Test Song One',
    artistName: 'Artist A',
    artworkUrl100: '/a.png',
    listens: 5,
    previewUrl: undefined,
  },
  {
    trackId: 2,
    trackName: 'Test Song Two',
    artistName: 'Artist B',
    artworkUrl100: '/b.png',
    listens: 3,
    previewUrl: undefined,
  },
]

const playlistMocks = [
  {
    request: { query: Q_PLAYLISTS },
    result: { data: { playlists: [] } },
  },
]

function renderWithProviders(ui: ReactElement) {
  return render(
    <MockedProvider mocks={playlistMocks}>
      <PlayerProvider>{ui}</PlayerProvider>
    </MockedProvider>
  )
}

describe('Toptracks component', () => {
  beforeEach(() => {
    // Reset mock and set default response
    ;(graphqlFetch as any).mockReset()
    ;(graphqlFetch as any).mockResolvedValue({ topTracks: sampleTracks })
  })

  it('renders a list of top tracks fetched from graphqlFetch', async () => {
    renderWithProviders(<Toptracks limit={2} />)

    // Expect to see track names rendered
    expect(await screen.findByText('Test Song One')).toBeTruthy()
    expect(await screen.findByText('Test Song Two')).toBeTruthy()
  })

  it('renders gracefully when API returns no tracks', async () => {
    ;(graphqlFetch as any).mockResolvedValue({ topTracks: [] })

    renderWithProviders(<Toptracks limit={5} />)

    // Component should not crash; either show an empty state or no items.
    const maybeItems = screen.queryAllByText(/Test Song/)
    expect(maybeItems.length).toBe(0)
  })

  it('shows an error message when fetching top tracks fails', async () => {
    ;(graphqlFetch as any).mockRejectedValue(new Error('Top tracks error'))

    renderWithProviders(<Toptracks limit={2} />)

    // Expect some generic error text in Norwegian or English containing "feil" or "error"
    const errorNode =
      (await screen.findByText(/feil/i).catch(() => null)) || (await screen.findByText(/error/i))
    expect(errorNode).toBeTruthy()
  })
})

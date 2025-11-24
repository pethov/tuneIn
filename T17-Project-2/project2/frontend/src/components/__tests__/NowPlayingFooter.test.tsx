import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { InMemoryCache } from '@apollo/client'
import NowPlayingFooter from '../play/NowPlayingFooter'
import { PlayerProvider, usePlayer } from '../../player/PlayerContext'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Q_PLAYLISTS } from '../../graphql/playlist'

const sampleTrack = {
  trackId: 123,
  trackName: 'Sample Track',
  artistName: 'Sample Artist',
  artworkUrl100: '/art.png',
  previewUrl: undefined,
}

function SetupPlayer() {
  const { setQueue } = usePlayer()
  useEffect(() => {
    setQueue([sampleTrack], 0)
  }, [setQueue])
  return null
}

describe('NowPlayingFooter', () => {
  it('shows track metadata when a queue is set', async () => {
    // jsdom does not implement HTMLMediaElement.play/pause/load; mock them
    ;(window as any).HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
    ;(window as any).HTMLMediaElement.prototype.pause = vi.fn()
    ;(window as any).HTMLMediaElement.prototype.load = vi.fn()

    const mocks = [
      {
        request: { query: Q_PLAYLISTS },
        result: { data: { __typename: 'Query', playlists: [] } },
      },
    ]

    render(
      <MockedProvider mocks={mocks} cache={new InMemoryCache()}>
        <MemoryRouter>
          <PlayerProvider>
            <SetupPlayer />
            <NowPlayingFooter />
          </PlayerProvider>
        </MemoryRouter>
      </MockedProvider>
    )

    expect(await screen.findByText('Sample Track')).toBeTruthy()
    expect(await screen.findByText(/Sample Artist/)).toBeTruthy()
  })
})

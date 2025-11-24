import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Provide mock implementations via vi.mock factories. For @apollo/client we
// partially mock the module (keep gql and other exports) and only override
// the hooks we need.
vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...(actual as any), useQuery: vi.fn(), useMutation: vi.fn() }
})
vi.mock('../../player/PlayerContext', () => ({ usePlayer: vi.fn() }))
vi.mock('../../hooks/useIsMobile', () => ({ useIsMobile: vi.fn() }))
vi.mock('../../lib/recentPlaylists', () => ({ pushRecentPlaylist: vi.fn() }))
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}))

describe('Playlist component', () => {
  it('shows missing id message when no id param', async () => {
    const rr = await import('react-router-dom')
    ;(rr.useParams as any).mockReturnValue({})
    const { default: Playlist } = await import('../playlist/Playlist')
    render(<Playlist />)
    expect(screen.getByText('Missing playlist-id.')).toBeTruthy()
  })

  it('shows loading when query is loading', async () => {
    const rr = await import('react-router-dom')
    ;(rr.useParams as any).mockReturnValue({ id: 'p1' })
    const apollo = await import('@apollo/client')
    ;(apollo.useQuery as any).mockReturnValue({ loading: true })
    ;(apollo.useMutation as any).mockReturnValue([vi.fn(), { loading: false }])
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({
      setQueue: vi.fn(),
      queue: [],
      index: 0,
      playing: false,
      toggle: vi.fn(),
      shuffle: false,
      toggleShuffle: vi.fn(),
    })
    const isMobile = await import('../../hooks/useIsMobile')
    ;(isMobile.useIsMobile as any).mockReturnValue(false)
    const { default: Playlist } = await import('../playlist/Playlist')
    render(<Playlist />)
    expect(screen.getByText('Loading…')).toBeTruthy()
  })

  it('shows error when query errors', async () => {
    const rr = await import('react-router-dom')
    ;(rr.useParams as any).mockReturnValue({ id: 'p1' })
    const apollo = await import('@apollo/client')
    ;(apollo.useQuery as any).mockReturnValue({ loading: false, error: new Error('fail') })
    ;(apollo.useMutation as any).mockReturnValue([vi.fn(), { loading: false }])
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({
      setQueue: vi.fn(),
      queue: [],
      index: 0,
      playing: false,
      toggle: vi.fn(),
      shuffle: false,
      toggleShuffle: vi.fn(),
    })
    const isMobile = await import('../../hooks/useIsMobile')
    ;(isMobile.useIsMobile as any).mockReturnValue(false)
    const { default: Playlist } = await import('../playlist/Playlist')
    render(<Playlist />)
    expect(screen.getByText('Failed to load playlist.')).toBeTruthy()
  })

  it('shows not found when playlist is null', async () => {
    const rr = await import('react-router-dom')
    ;(rr.useParams as any).mockReturnValue({ id: 'p1' })
    const apollo = await import('@apollo/client')
    ;(apollo.useQuery as any).mockReturnValue({
      loading: false,
      error: undefined,
      data: { playlist: null },
    })
    ;(apollo.useMutation as any).mockReturnValue([vi.fn(), { loading: false }])
    const player = await import('../../player/PlayerContext')
    ;(player.usePlayer as any).mockReturnValue({
      setQueue: vi.fn(),
      queue: [],
      index: 0,
      playing: false,
      toggle: vi.fn(),
      shuffle: false,
      toggleShuffle: vi.fn(),
    })
    const isMobile = await import('../../hooks/useIsMobile')
    ;(isMobile.useIsMobile as any).mockReturnValue(false)
    const { default: Playlist } = await import('../playlist/Playlist')
    render(<Playlist />)
    expect(screen.getByText('Could not find playlist.')).toBeTruthy()
  })

  it('renders playlist and handles playAll by queuing tracks', async () => {
    const rr = await import('react-router-dom')
    ;(rr.useParams as any).mockReturnValue({ id: 'p1' })

    const apollo = await import('@apollo/client')
    const sample = {
      playlist: {
        playlistId: 'p1',
        playlistName: 'My Playlist',
        tracks: [
          {
            position: 1,
            addedAt: '2020',
            track: {
              trackId: '10',
              trackName: 'Song A',
              artistName: 'Artist A',
              artworkUrl100: '/a.png',
            },
          },
          {
            position: 2,
            addedAt: '2020',
            track: {
              trackId: '20',
              trackName: 'Song B',
              artistName: 'Artist B',
              artworkUrl100: '/b.png',
            },
          },
        ],
      },
    }
    ;(apollo.useQuery as any).mockReturnValue({ loading: false, error: undefined, data: sample })

    const player = await import('../../player/PlayerContext')
    const setQueue = vi.fn()
    const toggle = vi.fn()
    ;(player.usePlayer as any).mockReturnValue({
      setQueue,
      queue: [],
      index: 0,
      playing: false,
      toggle,
      shuffle: false,
      toggleShuffle: vi.fn(),
    })

    const mutation = await import('@apollo/client')
    ;(mutation.useMutation as any).mockReturnValue([vi.fn(), { loading: false }])
    ;(rr.useLocation as any).mockReturnValue({ key: 'default' })

    const { default: Playlist } = await import('../playlist/Playlist')
    render(<Playlist />)

    expect(screen.getByText('My Playlist')).toBeTruthy()
    expect(screen.getByText('2 tracks')).toBeTruthy()

    const playAllBtn = screen.getByLabelText('Play/Pause all')
    fireEvent.click(playAllBtn)
    expect(setQueue).toHaveBeenCalled()
  })
})

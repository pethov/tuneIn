import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock getOrCreateUserId to return a stable user id
vi.mock('../../lib/userId', () => ({ getOrCreateUserId: () => 'user1' }))

// Mock react-router useParams to supply playlist id
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return { ...actual, useParams: () => ({ id: 'pl1' }) }
})

// Mock Apollo hooks
const mockRefetch = vi.fn()
const mockRemove = vi.fn().mockResolvedValue({})
vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<any>('@apollo/client')
  return {
    ...actual,
    useQuery: () => ({
      data: {
        playlist: {
          playlistId: 'pl1',
          playlistName: 'My Test Playlist',
          tracks: [
            {
              position: 1,
              track: {
                trackId: 't1',
                trackName: 'First',
                artistName: 'A',
                artworkUrl100: '/a.png',
              },
            },
            {
              position: 2,
              track: {
                trackId: 't2',
                trackName: 'Second',
                artistName: 'B',
                artworkUrl100: '/b.png',
              },
            },
          ],
        },
      },
      loading: false,
      refetch: mockRefetch,
    }),
    useMutation: () => [mockRemove],
  }
})

// Provide a mock usePlayer with setQueue spy
const mockSetQueue = vi.fn()
vi.mock('../../player/PlayerContext', () => ({ usePlayer: () => ({ setQueue: mockSetQueue }) }))

import PlaylistView from '../PlaylistView'

describe('PlaylistView', () => {
  beforeEach(() => {
    mockSetQueue.mockReset()
    mockRefetch.mockReset()
    mockRemove.mockReset()
  })

  it('renders playlist and calls setQueue when playAll clicked', async () => {
    render(<PlaylistView />)

    expect(await screen.findByText('My Test Playlist')).toBeTruthy()

    const playBtn = screen.getByText('Spill av')
    fireEvent.click(playBtn)

    expect(mockSetQueue).toHaveBeenCalled()
    const [queueArg, startIndex] = mockSetQueue.mock.calls[0]
    expect(Array.isArray(queueArg)).toBe(true)
    expect(queueArg[0].trackId).toBe(Number('t1'))
    expect(startIndex).toBe(0)
  })

  it('calls removeTrack and refetch when remove button clicked', async () => {
    render(<PlaylistView />)

    // find the first remove button in the list
    const removeButtons = await screen.findAllByText('Fjern')
    expect(removeButtons.length).toBeGreaterThan(0)
    fireEvent.click(removeButtons[0])

    // wait for refetch to be called after the mutation resolves
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled())
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PlaylistCard from '../playlist/PlaylistCard'
import { MemoryRouter } from 'react-router-dom'

describe('PlaylistCard', () => {
  it('renders cover, title and track count as a link', () => {
    const tracks = [{ track: { artworkUrl100: '/cover.png' } }]
    render(
      <MemoryRouter>
        <PlaylistCard playlistId="p1" playlistName="My Playlist" trackCount={3} tracks={tracks} />
      </MemoryRouter>
    )

    expect(screen.getByText('My Playlist')).toBeTruthy()
    expect(screen.getByText('3 tracks')).toBeTruthy()
    // image has empty alt in the component so it is presentation-wise; query it via the link element
    const link = screen.getByRole('link') as HTMLAnchorElement
    const img = link.querySelector('img') as HTMLImageElement | null
    expect(img).not.toBeNull()
    expect(img!.src).toContain('/cover.png')
    // link should navigate to playlist path
    expect(link.getAttribute('href')).toBe('/playlists/p1')
  })

  it('renders as a button when asButton is true and handles clicks', () => {
    const onClick = vi.fn()
    render(
      <PlaylistCard
        playlistId="p2"
        playlistName="BtnList"
        trackCount={1}
        asButton
        onClick={onClick}
      />
    )

    const btn = screen.getByRole('button') as HTMLButtonElement
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
    expect(screen.getByText('BtnList')).toBeTruthy()
    expect(screen.getByText('1 track')).toBeTruthy()
  })
})

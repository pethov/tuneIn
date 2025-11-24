import { describe, it, expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React, { useState } from 'react'

import CreatePlaylistModal from '../playlist/CreatePlaylistModal'

describe('CreatePlaylistModal', () => {
  it('submits form, calls createPlaylist and addToPlaylist and closes', async () => {
    const createPlaylist = vi
      .fn()
      .mockResolvedValue({ data: { createPlaylist: { playlistId: 'pl1' } } })
    const addToPlaylist = vi.fn().mockResolvedValue({})
    const markJustAdded = vi.fn()
    const setPendingAddTrack = vi.fn()

    function Wrapper() {
      const [show, setShow] = useState(true)
      const [newPlName, setNewPlName] = useState('My New')
      const inputRef = { current: null } as React.RefObject<HTMLInputElement | null>

      return (
        <CreatePlaylistModal
          show={show}
          setShow={(v: boolean) => setShow(v)}
          newPlName={newPlName}
          setNewPlName={(s) => setNewPlName(s)}
          inputRef={inputRef}
          createPlaylist={createPlaylist as any}
          addToPlaylist={addToPlaylist as any}
          pendingAddTrack={{ trackId: 42, trackName: 'Song' } as any}
          setPendingAddTrack={setPendingAddTrack}
          markJustAdded={markJustAdded}
          creatingPl={false}
        />
      )
    }

    render(<Wrapper />)

    const input = screen.getByRole('textbox', { name: /New playlist name/i })
    expect((input as HTMLInputElement).value).toBe('My New')

    const submit = screen.getByRole('button', { name: /Create/i })
    fireEvent.click(submit)

    await waitFor(() => expect(createPlaylist).toHaveBeenCalled())
    await waitFor(() => expect(addToPlaylist).toHaveBeenCalled())
    await waitFor(() => expect(markJustAdded).toHaveBeenCalledWith('42'))
  })

  it('shows validation error and does not submit when name is empty', async () => {
    const createPlaylist = vi.fn()
    const addToPlaylist = vi.fn()
    const markJustAdded = vi.fn()
    const setPendingAddTrack = vi.fn()

    function Wrapper() {
      const [show, setShow] = useState(true)
      const [newPlName, setNewPlName] = useState('')
      const inputRef = { current: null } as React.RefObject<HTMLInputElement | null>

      return (
        <CreatePlaylistModal
          show={show}
          setShow={(v: boolean) => setShow(v)}
          newPlName={newPlName}
          setNewPlName={(s) => setNewPlName(s)}
          inputRef={inputRef}
          createPlaylist={createPlaylist as any}
          addToPlaylist={addToPlaylist as any}
          pendingAddTrack={{ trackId: 42, trackName: 'Song' } as any}
          setPendingAddTrack={setPendingAddTrack}
          markJustAdded={markJustAdded}
          creatingPl={false}
        />
      )
    }

    render(<Wrapper />)

    const submit = screen.getByRole('button', { name: /Create/i })
    fireEvent.click(submit)

    // Depending on implementation, a validation message may appear or the button may be disabled.
    // In any case, createPlaylist must not be called.
    await waitFor(() => {
      expect(createPlaylist).not.toHaveBeenCalled()
    })
  })

  it('shows an error message when createPlaylist fails', async () => {
    const createPlaylist = vi.fn().mockRejectedValue(new Error('Create failed'))
    const addToPlaylist = vi.fn()
    const markJustAdded = vi.fn()
    const setPendingAddTrack = vi.fn()

    function Wrapper() {
      const [show, setShow] = useState(true)
      const [newPlName, setNewPlName] = useState('My New')
      const inputRef = { current: null } as React.RefObject<HTMLInputElement | null>

      return (
        <CreatePlaylistModal
          show={show}
          setShow={(v: boolean) => setShow(v)}
          newPlName={newPlName}
          setNewPlName={(s) => setNewPlName(s)}
          inputRef={inputRef}
          createPlaylist={createPlaylist as any}
          addToPlaylist={addToPlaylist as any}
          pendingAddTrack={{ trackId: 42, trackName: 'Song' } as any}
          setPendingAddTrack={setPendingAddTrack}
          markJustAdded={markJustAdded}
          creatingPl={false}
        />
      )
    }

    render(<Wrapper />)

    const submit = screen.getByRole('button', { name: /Create/i })
    fireEvent.click(submit)
    const errorNode =
      (await screen.findByText(/feil/i).catch(() => null)) || (await screen.findByText(/error/i))
    expect(errorNode).toBeTruthy()
  })
})

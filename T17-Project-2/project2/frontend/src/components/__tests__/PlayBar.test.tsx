import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import PlayBar from '../play/PlayBar'

describe('PlayBar', () => {
  it('renders times and calls pointer handlers', () => {
    const onPointerDownBar = vi.fn()
    const onPointerMoveBar = vi.fn()
    const onPointerUpBar = vi.fn()
    const fmt = (t: number) => `${t}s`

    const barRef = { current: null } as React.RefObject<HTMLDivElement | null>

    render(
      <PlayBar
        currentTime={10}
        duration={100}
        progress={10}
        barRef={barRef}
        onPointerDownBar={onPointerDownBar}
        onPointerMoveBar={onPointerMoveBar}
        onPointerUpBar={onPointerUpBar}
        fmt={fmt}
      />
    )

    expect(screen.getByText('10s')).toBeTruthy()
    const prog = screen.getByRole('progressbar', { name: /Progress bar/i })
    fireEvent.pointerDown(prog)
    expect(onPointerDownBar).toHaveBeenCalled()

    const thumb = screen.getByRole('slider', { name: /Seek/i })
    fireEvent.pointerDown(thumb)
    expect(onPointerDownBar).toHaveBeenCalled()
  })
})

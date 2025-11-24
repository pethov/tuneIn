import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchInput from '../songSearch/SearchInput'
import React from 'react'

describe('SearchInput', () => {
  it('renders with given term and calls setTerm on input change', () => {
    const setTerm = vi.fn()
    const inputRef = { current: null } as React.RefObject<HTMLInputElement | null>

    render(<SearchInput term="foo" setTerm={setTerm} inputRef={inputRef} />)

    const input = screen.getByRole('searchbox', { name: /søkefelt/i }) as HTMLInputElement
    expect(input.value).toBe('foo')

    fireEvent.change(input, { target: { value: 'bar' } })
    expect(setTerm).toHaveBeenCalledWith('bar')
  })
})

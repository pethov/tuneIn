/// <reference types="@testing-library/jest-dom" />
// src/components/__tests__/Filter.test.tsx
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)
import { render, screen, waitFor, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock graphqlFetch so we can control answers from backend
vi.mock('../../lib/graphqlFetch', async () => {
  return {
    graphqlFetch: vi.fn(),
  }
})

import { graphqlFetch } from '../../lib/graphqlFetch'
import Filters from '../songSearch/Filter'

// Helper: control what the mocked graphqlFetch returns per query
function mockGqlHandlers(handlers: {
  genresForTerm?: (vars: any) => { genresForTerm: string[] }
  artistsForTerm?: (vars: any) => { artistsForTerm: string[] }
}) {
  // graphqlFetch is mocked above via vi.mock and is a vi.fn(). Use a loose any
  // cast to access mockImplementation in Vitest.
  ;(graphqlFetch as unknown as any).mockImplementation(async (query: string, variables: any) => {
    const q = String(query || '')
    if (q.includes('genresForTerm') && handlers.genresForTerm) {
      return handlers.genresForTerm(variables)
    }
    if (q.includes('artistsForTerm') && handlers.artistsForTerm) {
      return handlers.artistsForTerm(variables)
    }
    // default empty response
    return {}
  })
}

describe('<Filters />', () => {
  beforeEach(() => {
    ;(graphqlFetch as any).mockReset()
  })

  afterEach(() => {
    // ensure DOM is cleaned between tests to avoid duplicate elements
    cleanup()
  })

  it('deaktiverer artist-filter når term < 2 og ingen sjanger er valgt', async () => {
    mockGqlHandlers({}) // ikke relevant for denne

    render(
      <Filters
        term="a" // < 2 tegn
        selectedArtists={[]}
        selectedGenres={[]}
        onChange={() => {}}
      />
    )

    const artistBtn = screen.getByRole('button', { name: /artists/i })
    expect(artistBtn).toBeDisabled()
    expect(artistBtn).toHaveAttribute('aria-disabled', 'true')
  })

  it('resetter artister til tomt når lagrede sjangre ikke har overlapp med valgte artister', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    // Start: én valgt artist ('A1'), ingen sjangre
    // Når vi åpner sjanger-popup og lagrer 'Rock', skal komponenten hente gyldige artister
    // for 'Rock'. Vi svarer med [] -> ingen gyldige, dermed forventes onChange([], ['Rock']).
    mockGqlHandlers({
      // Når sjanger-popup åpnes, last sjanger-alternativer: vis 'Rock'
      genresForTerm: () => ({ genresForTerm: ['Rock'] }),
      // Når saveGenres() kjører, spør den om artistsForTerm for valgte sjangre:
      // her sier vi at ingen artister er gyldige under 'Rock'
      artistsForTerm: (vars) => {
        expect(vars.genres).toEqual(['Rock']) // sanity-check
        return { artistsForTerm: [] }
      },
    })

    render(
      <Filters
        term="" // tom term, men sjanger skal trigge artist-filter senere
        selectedArtists={['A1']}
        selectedGenres={[]}
        onChange={onChange}
      />
    )

    // Åpne sjanger-popup
    const genresBtn = screen.getByRole('button', { name: /genres/i })
    await user.click(genresBtn)

    // Dropdown innhold lastes fra mock (Rock)
    const popup = await screen.findByRole('group', { name: /genre options/i })
    const listbox = within(popup).getByRole('listbox')
    // Klikk 'Rock' i listen (det rendres som <li> i popup-listen)
    const rockItem = within(listbox).getByText('Rock')
    await user.click(rockItem)

    // Lagre sjanger-valget
    const saveBtn = within(popup).getByRole('button', { name: /save/i })
    await user.click(saveBtn)

    // Etter saveGenres: loadArtistOptions svarer med tom liste → artister resettes
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })

    // Finn siste kall til onChange og verifiser at artister ble tømt, sjanger beholdt
    const last = onChange.mock.calls.at(-1)
    expect(last).toBeDefined()
    const lastCall = last as any
    expect(lastCall[0]).toEqual([]) // artists
    expect(lastCall[1]).toEqual(['Rock']) // genres

    // Bonus: nå skal Artist-knappen være aktiv (kanUseArtist blir true pga valgt sjanger)
    const artistBtn = screen.getByRole('button', { name: /artists/i })
    expect(artistBtn).not.toBeDisabled()
  })
})

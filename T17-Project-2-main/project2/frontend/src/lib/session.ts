// small safe wrapper around sessionStorage for the song search feature
const PREFIX = 'songsearch:'

export const KEYS = {
  term: PREFIX + 'term',
  sortBy: PREFIX + 'sortBy',
  sortDirection: PREFIX + 'sortDirection',
  artists: PREFIX + 'artists',
  genres: PREFIX + 'genres',
}

export function readJSON<T = unknown>(key: string): T | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null
    const s = sessionStorage.getItem(key)
    if (!s) return null
    return JSON.parse(s) as T
  } catch {
    // ignore parse errors
    return null
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / other errors
  }
}

export function removeKey(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

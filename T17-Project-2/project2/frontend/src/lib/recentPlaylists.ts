const LS_KEY = 'tunein_recent_playlists'
const LS_PLAYED_KEY = 'tunein_playlist_last_played_map'
const MAX = 4

export type PlayedMap = Record<string, string>

function readPlayedMap(): PlayedMap {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {}
    const raw = localStorage.getItem(LS_PLAYED_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return {}
    const entries = Object.entries(obj).filter(
      ([key, value]) => typeof key === 'string' && typeof value === 'string'
    ) as [string, string][]
    return Object.fromEntries(entries) as PlayedMap
  } catch {
    return {}
  }
}

function recordPlayedAt(id: string) {
  if (!id) return
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    const map = readPlayedMap()
    map[id] = new Date().toISOString()
    localStorage.setItem(LS_PLAYED_KEY, JSON.stringify(map))
  } catch {
    // ignore storage issues
  }
}

export function markPlaylistPlayed(id: string): void {
  recordPlayedAt(id)
}

export function getPlaylistLastPlayedMap(): PlayedMap {
  return readPlayedMap()
}

export function getRecentPlaylists(): string[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return []
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter((v) => typeof v === 'string')
  } catch {
    return []
  }
}

export function pushRecentPlaylist(id: string): void {
  if (!id) return
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    const cur = getRecentPlaylists()
    // remove existing occurrence
    const dedup = cur.filter((x) => x !== id)
    // add to front
    dedup.unshift(id)
    // trim
    const trimmed = dedup.slice(0, MAX)
    localStorage.setItem(LS_KEY, JSON.stringify(trimmed))
    // Notify other parts of the app in the same window that recents changed.
    try {
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('tunein:recent-playlists-changed'))
      }
    } catch {
      // ignore dispatch errors
    }
    recordPlayedAt(id)
  } catch {
    // ignore storage errors
  }
}

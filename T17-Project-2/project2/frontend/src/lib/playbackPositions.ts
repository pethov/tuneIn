const LS_KEY = 'tunein_playback_positions'

type Positions = { [trackKey: string]: number }

function readAll(): Positions {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {}
    const s = localStorage.getItem(LS_KEY)
    if (!s) return {}
    const parsed = JSON.parse(s)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as Positions
  } catch {
    return {}
  }
}

function writeAll(obj: Positions) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    localStorage.setItem(LS_KEY, JSON.stringify(obj))
  } catch {
    // ignore
  }
}

export function getPosition(key: string): number | null {
  if (!key) return null
  try {
    const all = readAll()
    const v = all[key]
    return typeof v === 'number' && isFinite(v) ? v : null
  } catch {
    return null
  }
}

export function setPosition(key: string, seconds: number): void {
  if (!key) return
  try {
    // Only persist the currently playing track's position. Do not keep
    // positions for all tracks to avoid unbounded growth in localStorage.
    const secs = Math.max(0, Number(seconds) || 0)
    // If position is zero, clear storage (no need to remember zero positions)
    if (secs === 0) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(LS_KEY)
        }
      } catch {
        // ignore
      }
      return
    }
    const obj: Positions = { [key]: secs }
    writeAll(obj)
  } catch {
    // ignore
  }
}

export function removePosition(key: string): void {
  if (!key) return
  try {
    const all = readAll()
    if (Object.prototype.hasOwnProperty.call(all, key)) {
      delete all[key]
      writeAll(all)
    }
  } catch {
    // ignore
  }
}

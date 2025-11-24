import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { pushRecentPlaylist } from '../lib/recentPlaylists'
import type { Track } from '../types'

type PlayerCtx = {
  queue: Track[]
  index: number
  playing: boolean
  // q: the actual queue to play (may be shuffled)
  // startIndex: where to start playing in q
  // source?: optional canonical (unshuffled) track ordering for the queued list
  setQueue: (
    q: Track[],
    startIndex?: number,
    source?: Track[] | null,
    sourceType?: string | null
  ) => void
  appendToQueue: (tracks: Track[], sourceType?: string | null) => void
  removeFromQueue: (trackId: Track['trackId']) => void
  playAt: (i: number) => void
  toggle: () => void
  next: () => void
  prev: () => void
  // Expose current <audio> element for footer component to bind/ref
  audioRef: React.MutableRefObject<HTMLAudioElement | null>
  // Global shuffle mode (when true, newly queued playlists should be shuffled)
  shuffle: boolean
  toggleShuffle: () => void
  // Repeat mode: 'off' | 'playlist' (wrap) | 'one' (repeat current track)
  repeatMode: 'off' | 'playlist' | 'one'
  toggleRepeatMode: () => void
  setRepeatMode: (m: 'off' | 'playlist' | 'one') => void
  // Type of the current queue source: 'playlist' | 'toptracks' | 'search' | null
  queueSourceType: string | null
  // full source string as provided to setQueue (may be e.g. 'playlist:<id>' or 'search')
  queueSource: string | null
  // true when the PlayerProvider has hydrated state from localStorage
  hydrated: boolean
}

const Ctx = createContext<PlayerCtx | null>(null)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueueState] = useState<Track[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Keep canonical (unshuffled) ordering when a playlist was queued from a source
  const canonicalRef = useRef<Track[] | null>(null)
  const [queueSourceType, setQueueSourceType] = useState<string | null>(null)
  const [queueSource, setQueueSource] = useState<string | null>(null)
  const [repeatMode, setRepeatMode] = useState<'off' | 'playlist' | 'one'>('off')
  const [shuffle, setShuffle] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('player.shuffle')
      return raw ? (JSON.parse(raw) as boolean) : false
    } catch {
      return false
    }
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const RESTORE_KEY = 'player.state'
  // During initial restore we don't want to treat restored setQueue as a user
  // action (which would push recent-playlist entries). Use this flag to
  // suppress those side-effects while hydrating state from localStorage.
  const restoringRef = useRef<boolean>(false)

  const setQueue = useCallback(
    (
      q: Track[],
      startIndex = 0,
      source: Track[] | null = null,
      sourceType: string | null = null
    ) => {
      // Store canonical ordering (unshuffled) for later restoration when shuffle is toggled off
      canonicalRef.current = source ?? q

      // If shuffle is currently enabled, immediately apply shuffle semantics
      // so the newly queued list becomes randomized (with the chosen track first).
      if (shuffle) {
        const canonical = canonicalRef.current ?? q
        const current = canonical[startIndex] ?? canonical[0]
        // Build shuffled remainder excluding the current track
        const remaining = canonical.filter((t) => t.trackId !== current.trackId)
        for (let i = remaining.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const tmp = remaining[i]
          remaining[i] = remaining[j]
          remaining[j] = tmp
        }
        const newQueue = [current, ...remaining]
        setQueueState(newQueue)
        setIndex(0)
        setPlaying(true)
      } else {
        // Default behavior: set queue and start at provided index
        setQueueState(q)
        setIndex(startIndex)
        setPlaying(true)
      }

      // Normalize sourceType: allow 'playlist:<id>' but expose base type 'playlist' to the rest of the app
      const baseSourceType =
        typeof sourceType === 'string' && sourceType.startsWith('playlist:')
          ? 'playlist'
          : (sourceType ?? null)
      setQueueSourceType(baseSourceType)
      setQueueSource(sourceType ?? null)

      // If this queue originated from a playlist, persist it as a recently played playlist.
      // Skip this during hydration/restore to avoid duplicating history entries.
      try {
        if (
          !restoringRef.current &&
          typeof sourceType === 'string' &&
          sourceType.startsWith('playlist:')
        ) {
          const pid = sourceType.slice('playlist:'.length)
          if (pid) pushRecentPlaylist(pid)
        }
      } catch {
        // ignore errors from recent playlist persistence
      }

      // If the new queue comes from search results, disable playlist-level repeat modes
      // (search queues shouldn't allow repeat playlist behavior).
      if (sourceType === 'search') {
        try {
          setRepeatMode('off')
        } catch {
          /* ignore */
        }
      }

      // If the queue was started from a playlist identifier, record it as recent so
      // the Home page's recents reflect the last-listened playlist. Accepts a
      // sourceType like "playlist:<id>".
      try {
        if (typeof sourceType === 'string' && sourceType.startsWith('playlist:')) {
          const parts = sourceType.split(':', 2)
          const pid = parts[1]
          if (pid) pushRecentPlaylist(pid)
        }
      } catch {
        // ignore errors from recent-playlist tracking
      }
    },
    [shuffle]
  )

  const appendToQueue = useCallback(
    (tracks: Track[], sourceType: string | null = null) => {
      if (!tracks || tracks.length === 0) return
      // Ensure canonical ordering is extended (unshuffled reference)
      const canonicalCurrent = canonicalRef.current ?? queue
      canonicalRef.current = [...canonicalCurrent, ...tracks]

      // If shuffle is off, simply append to visible queue
      if (!shuffle) {
        setQueueState((prev) => [...prev, ...tracks])
      } else {
        // If shuffle is on, integrate the new tracks into the unplayed remainder
        // so they will be played in random order. Preserve already-played items
        // (indices < index) and the currently playing track (index).
        const curIndex = index
        const played = queue.slice(0, curIndex + 1) // includes current
        const unplayed = queue.slice(curIndex + 1)

        // Build a new unplayed list with appended tracks, then shuffle it
        const newUnplayed = unplayed.concat(tracks)
        for (let i = newUnplayed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const tmp = newUnplayed[i]
          newUnplayed[i] = newUnplayed[j]
          newUnplayed[j] = tmp
        }

        // Reconstruct queue, keeping the same current index
        const newQueue = played.concat(newUnplayed)
        setQueueState(newQueue)
        // index stays the same so playback continues uninterrupted
      }

      // If a sourceType is provided, update queueSource and base type
      const baseSourceType =
        typeof sourceType === 'string' && sourceType.startsWith('playlist:')
          ? 'playlist'
          : (sourceType ?? null)
      setQueueSourceType(baseSourceType)
      setQueueSource(sourceType ?? null)
    },
    [queue, shuffle, index]
  )

  const removeFromQueue = useCallback(
    (trackId: Track['trackId']) => {
      const removalIndex = queue.findIndex((t) => t.trackId === trackId)
      if (removalIndex === -1) return

      const nextQueue = queue.filter((t) => t.trackId !== trackId)

      const canonical = canonicalRef.current
      if (canonical) {
        canonicalRef.current = canonical.filter((t) => t.trackId !== trackId)
      }

      setQueueState(nextQueue)

      setIndex((currentIndex) => {
        if (nextQueue.length === 0) return 0
        if (removalIndex < currentIndex) return Math.max(0, currentIndex - 1)
        if (removalIndex === currentIndex) {
          const candidate = Math.min(removalIndex, nextQueue.length - 1)
          return candidate < 0 ? 0 : candidate
        }
        return Math.min(currentIndex, nextQueue.length - 1)
      })

      setPlaying((wasPlaying) => {
        if (!wasPlaying) return wasPlaying
        return nextQueue.length > 0
      })
    },
    [queue]
  )

  const playAt = useCallback((i: number) => {
    setIndex(i)
    setPlaying(true)
  }, [])

  const toggle = useCallback(() => setPlaying((p) => !p), [])
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), [])
  const toggleRepeatMode = useCallback(
    () => setRepeatMode((m) => (m === 'off' ? 'playlist' : m === 'playlist' ? 'one' : 'off')),
    []
  )

  // Persist shuffle preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('player.shuffle', JSON.stringify(shuffle))
    } catch {
      // ignore write errors (e.g., disabled storage)
    }
  }, [shuffle, queue, index])
  // When shuffle is turned off, restore canonical queue ordering and keep the current
  // track playing (matched by trackId) so playback continues from the same song but
  // follows the playlist order.
  useEffect(() => {
    if (shuffle) return // only act when shuffle is false
    const canonical = canonicalRef.current
    if (!canonical || queue.length === 0) return
    // Find currently playing track id
    const current = queue[index]
    if (!current) return
    const tid = current.trackId
    const newIndex = canonical.findIndex((t) => t.trackId === tid)
    // If current track exists in canonical order, restore canonical queue and set index
    // Avoid setting state if the queue and index are already the same to prevent
    // unnecessary re-renders which can cause an update loop.
    const shouldRestoreQueue = !(
      queue.length === canonical.length && queue.every((t, i) => t.trackId === canonical[i].trackId)
    )
    const targetIndex = newIndex >= 0 ? newIndex : 0
    const shouldUpdateIndex = index !== targetIndex
    if (shouldRestoreQueue || shouldUpdateIndex) {
      setQueueState(canonical)
      setIndex(targetIndex)
    }
  }, [shuffle, queue, index])

  // When shuffle is turned on, if we have a canonical ordering available, create
  // a shuffled queue where the currently playing track remains first and the
  // remaining tracks are shuffled. This ensures the "next" song is random while
  // the current song continues uninterrupted.
  useEffect(() => {
    if (!shuffle) return // only act when shuffle is true
    const canonical = canonicalRef.current
    if (!canonical || canonical.length === 0) return
    if (queue.length === 0) return
    const current = queue[index]
    if (!current) return

    // If the queue already appears shuffled (i.e. not strictly equal to canonical),
    // don't re-shuffle — user might have an explicitly shuffled queue.
    const isCanonical =
      queue.length === canonical.length && queue.every((t, i) => t.trackId === canonical[i].trackId)
    if (!isCanonical) return

    // Build shuffled remainder
    const remaining = canonical.filter((t) => t.trackId !== current.trackId)
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = remaining[i]
      remaining[i] = remaining[j]
      remaining[j] = tmp
    }
    const newQueue = [current, ...remaining]
    // Avoid updating state if the queue already equals the target shuffled queue
    const queuesEqual =
      newQueue.length === queue.length && newQueue.every((t, i) => t.trackId === queue[i].trackId)
    if (!queuesEqual || index !== 0) {
      setQueueState(newQueue)
      setIndex(0)
    }
    // Note: do not overwrite canonicalRef — we still want to restore the original
    // ordering when shuffle is turned off.
  }, [shuffle, queue, index])

  const next = useCallback(() => {
    setIndex((i) => {
      const n = i + 1
      return n < queue.length ? n : i
    })
    setPlaying(true)
  }, [queue.length])

  const prev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i))
    setPlaying(true)
  }, [])

  const value = useMemo<PlayerCtx>(
    () => ({
      queue,
      index,
      playing,
      setQueue,
      playAt,
      toggle,
      next,
      prev,
      audioRef,
      appendToQueue,
      removeFromQueue,
      shuffle,
      toggleShuffle,
      repeatMode,
      toggleRepeatMode,
      setRepeatMode,
      queueSourceType,
      queueSource,
      hydrated,
    }),
    [
      queue,
      index,
      playing,
      setQueue,
      playAt,
      toggle,
      next,
      prev,
      appendToQueue,
      removeFromQueue,
      shuffle,
      toggleShuffle,
      repeatMode,
      toggleRepeatMode,
      setRepeatMode,
      queueSourceType,
      queueSource,
      hydrated,
    ]
  )

  // Hydrate player state (queue/index/playing/repeatMode/queueSourceType) from localStorage
  useEffect(() => {
    // Skip browser-only hydration work when window isn't available (e.g. during SSR/tests)
    if (typeof window === 'undefined') {
      setHydrated(true)
      return
    }

    let hydrationTimeout: ReturnType<typeof setTimeout> | null = null
    try {
      const raw = localStorage.getItem(RESTORE_KEY)
      if (!raw) return
      const parsed: {
        queue?: Track[]
        index?: number
        playing?: boolean
        queueSourceType?: string | null
        queueSource?: string | null
        repeatMode?: 'off' | 'playlist' | 'one'
      } = JSON.parse(raw)
      if (!parsed || !parsed.queue || parsed.queue.length === 0) return
      restoringRef.current = true
      canonicalRef.current = parsed.queue
      setQueueState(parsed.queue)
      setIndex(typeof parsed.index === 'number' ? parsed.index : 0)
      setQueueSourceType(parsed.queueSourceType ?? null)
      setQueueSource(parsed.queueSource ?? null)
      setRepeatMode(parsed.repeatMode ?? 'off')
      // Always start paused after a refresh so the user has control to resume playback.
      // We still restore the queue and index so resuming will continue from the same spot.
      setPlaying(false)
    } catch {
      // ignore parse errors
    } finally {
      // allow a small delay to ensure consumers (audio element) mount; then clear restoring flag
      hydrationTimeout = setTimeout(() => {
        // If the test environment is torn down, window might disappear; bail out early
        if (typeof window === 'undefined') return
        restoringRef.current = false
        setHydrated(true)
      }, 50)
    }
    return () => {
      if (hydrationTimeout) clearTimeout(hydrationTimeout)
    }
  }, [])

  // Persist player state to localStorage whenever it changes
  useEffect(() => {
    try {
      const payload = JSON.stringify({
        queue,
        index,
        playing,
        queueSourceType,
        queueSource,
        repeatMode,
      })
      localStorage.setItem(RESTORE_KEY, payload)
    } catch {
      // ignore write errors
    }
  }, [queue, index, playing, queueSourceType, queueSource, repeatMode])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return v
}

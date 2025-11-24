import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FaTimes, FaPlus, FaCheck } from 'react-icons/fa'
import { Q_PLAYLISTS, M_ADD, M_CREATE } from '../../graphql/playlist'
import { useMutation, useQuery } from '@apollo/client'
import AddPlaylistModal from '../playlist/AddPlaylistModal'
import CreatePlaylistModal from '../playlist/CreatePlaylistModal'
import { usePlayer } from '../../player/PlayerContext'
import type { Track } from '../../types'
import { useIsMobile } from '../../hooks/useIsMobile'
import '../../styles/play/NowPlayingFooter.css'

// split controls
import PlayButton from './PlayButton'
import ShuffleButton from './ShuffleButton'
import PrevButton from './PrevButton'
import NextButton from './NextButton'
import RepeatButton from './RepeatButton'
import PlayBar from './PlayBar'
import { graphqlFetch } from '../../lib/graphqlFetch'
import { getPosition, setPosition, removePosition } from '../../lib/playbackPositions'

let currentAudio: HTMLAudioElement | null = null
const base = import.meta.env.BASE_URL ?? '/'
const normalizedBase = base.endsWith('/') ? base : `${base}/`
const DEFAULT_FAVICON = `${normalizedBase}placeholder.png`

const swallow = (fn: () => void) => {
  try {
    fn()
  } catch {
    // ignore best-effort DOM/media operations
  }
}

function MarqueeText({ text, className }: { text: string; className?: string }) {
  const wrapRef = useRef<HTMLElement | null>(null)
  const innerRef = useRef<HTMLSpanElement | null>(null)
  const [shouldScroll, setShouldScroll] = useState(false)

  const measure = useCallback(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!wrap || !inner) return

    // Check if content width exceeds container width
    const containerWidth = wrap.clientWidth
    const contentWidth = inner.scrollWidth
    const shouldAnimate = contentWidth > containerWidth
    setShouldScroll(shouldAnimate)

    if (shouldAnimate) {
      const scrollWidth = -(contentWidth - containerWidth)
      wrap.style.setProperty('--scroll-width', `${scrollWidth}px`)

      const duration = 3 + Math.abs(scrollWidth) * 0.01
      wrap.style.setProperty('--dur', `${duration}s`)
    }
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) {
      ro.observe(wrapRef.current)
    }
    return () => ro.disconnect()
  }, [text, measure])

  return (
    <section
      ref={wrapRef}
      className={`fp-marquee ${className ?? ''} ${shouldScroll ? 'is-scrolling' : ''}`}
      aria-label={text}
    >
      <span ref={innerRef} className="fp-marquee-inner">
        {text}
      </span>
    </section>
  )
}

// Central playback UI that mirrors what a native streaming footer typically does:
// hook into PlayerContext, own the <audio> element, and expose queue/playlist tooling.
export default function NowPlayingFooter() {
  const [visible, setVisible] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()
  // Subscribe to the entire playback surface so the footer can both reflect and mutate player state.
  const {
    queue,
    index,
    playing,
    playAt,
    toggle,
    audioRef,
    shuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeatMode,
    setRepeatMode,
    queueSourceType,
    appendToQueue,
    hydrated,
  } = usePlayer()

  type PlaylistsCache = {
    playlists: Array<{
      playlistId: string
      playlistName: string
      trackCount: number
      tracks?: Array<{
        track?: {
          trackId?: Track['trackId'] | null
          artworkUrl100?: string | null
        } | null
      }> | null
    }>
  }

  // Keep footer in lockstep with other playlist UIs by using Apollo cache.
  const { data: playlistsData } = useQuery<PlaylistsCache>(Q_PLAYLISTS)

  const playlistOptions = useMemo(() => {
    return (
      playlistsData?.playlists?.map((p) => ({
        playlistId: p.playlistId,
        playlistName: p.playlistName,
        tracks: p.tracks?.map((entry) => {
          const trackId = entry?.track?.trackId
          return {
            track: entry?.track
              ? {
                  ...(trackId != null ? { trackId } : {}),
                  artworkUrl100: entry.track.artworkUrl100 ?? undefined,
                }
              : null,
          }
        }),
      })) ?? []
    )
  }, [playlistsData])

  const existingPlaylistNames = useMemo(
    () => playlistOptions.map((p) => p.playlistName),
    [playlistOptions]
  )

  const [addToPlaylist] = useMutation(M_ADD, {
    onError(err) {
      console.error('addToPlaylist mutation error:', err)
      alert('Kunne ikke legge til i spilleliste: ' + (err?.message ?? 'ukjent feil'))
    },
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })

  const [createPlaylist, { loading: creatingPl }] = useMutation(M_CREATE, {
    update(cache, { data }) {
      try {
        const created = data?.createPlaylist
        if (!created) return
        const existing = cache.readQuery<PlaylistsCache>({ query: Q_PLAYLISTS })
        const next = (existing?.playlists ?? []).concat({
          playlistId: created.playlistId,
          playlistName: created.playlistName,
          trackCount: 0,
          tracks: [],
        })
        cache.writeQuery<PlaylistsCache>({ query: Q_PLAYLISTS, data: { playlists: next } })
      } catch {
        // ignore cache update errors
      }
    },
    onError: (e) => console.error('Create playlist error:', e),
    refetchQueries: [{ query: Q_PLAYLISTS }],
    awaitRefetchQueries: true,
  })
  const [openAddFor, setOpenAddFor] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const addToPlBtnRef = useRef<HTMLButtonElement | null>(null)
  const [showCreatePl, setShowCreatePl] = useState(false)
  const [newPlName, setNewPlName] = useState('')
  const createInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingAddTrack, setPendingAddTrack] = useState<Track | null>(null)
  const [justAddedFooter, setJustAddedFooter] = useState(false)
  const location = useLocation()

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const barRef = useRef<HTMLDivElement | null>(null)
  const seekingRef = useRef(false)
  const seekTimeRef = useRef<number | null>(null)
  const wasPlayingRef = useRef<boolean>(false)
  const prevPreviewRef = useRef<string | null>(null)
  // Only restore saved per-track positions once after a page hydration.
  const restoredFromStorageRef = useRef(false)

  // Compute seek time from pointer position but do NOT commit to audio element.
  // We only update audio.currentTime when the user releases the pointer.
  const updateTimeFromPointer = useCallback(
    (clientX: number) => {
      const bar = barRef.current
      if (!bar || !isFinite(duration) || duration <= 0) return null
      const rect = bar.getBoundingClientRect()
      const x = Math.min(Math.max(0, clientX - rect.left), rect.width)
      const ratio = rect.width > 0 ? x / rect.width : 0
      const t = ratio * duration
      seekTimeRef.current = t
      setCurrentTime(t)
      return t
    },
    [duration]
  )

  const onPointerDownBar = useCallback(
    (e: React.PointerEvent) => {
      const target = e.currentTarget as Element
      swallow(() => {
        ;(target as Element).setPointerCapture(e.pointerId)
      })
      seekingRef.current = true
      // remember whether playback was active when seeking started
      wasPlayingRef.current = playing
      updateTimeFromPointer(e.clientX)
    },
    [updateTimeFromPointer, playing]
  )

  const onPointerMoveBar = useCallback(
    (e: React.PointerEvent) => {
      if (!seekingRef.current) return
      updateTimeFromPointer(e.clientX)
    },
    [updateTimeFromPointer]
  )

  const onPointerUpBar = useCallback(
    (e: React.PointerEvent) => {
      const target = e.currentTarget as Element
      swallow(() => {
        ;(target as Element).releasePointerCapture(e.pointerId)
      })
      if (!seekingRef.current) return
      seekingRef.current = false
      const t = updateTimeFromPointer(e.clientX)
      const el = audioRef.current
      if (el && t != null) {
        swallow(() => {
          el.currentTime = t
        })
        // Only resume playback if the app was playing before the seek AND
        // the global `playing` state is currently true. This prevents
        // seeking while paused from starting playback automatically.
        if (wasPlayingRef.current && playing) {
          void el.play().catch(() => {})
        }
      }
      seekTimeRef.current = null
    },
    [updateTimeFromPointer, playing, audioRef]
  )

  const track: Track | undefined = queue[index]
  const open = !!track

  const artwork = useMemo(
    () => track?.artworkUrl100?.replace('100x100bb', '200x200bb') ?? track?.artworkUrl100,
    [track]
  )

  useEffect(() => {
    if (typeof document === 'undefined') return
    const favicon =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
      document.querySelector<HTMLLinkElement>('link[rel*="icon"]')
    if (!favicon) return

    const origin = window.location?.origin ?? ''
    const resolveHref = (href: string) => {
      try {
        return new URL(href, origin).toString()
      } catch {
        return href
      }
    }
    const nextHref = resolveHref(isMobile && artwork ? artwork : DEFAULT_FAVICON)
    if (favicon.href !== nextHref) favicon.href = nextHref

    return () => {
      favicon.href = resolveHref(DEFAULT_FAVICON)
    }
  }, [artwork, isMobile])

  const positionFooterDropdown = useCallback((rect?: DOMRect | null) => {
    if (typeof document === 'undefined') return
    const btnRect = rect ?? addToPlBtnRef.current?.getBoundingClientRect()
    if (!btnRect) return

    const width = 200
    const estimatedHeight = 220
    const left = Math.max(8, Math.round(btnRect.left + btnRect.width - width - 8))
    const top = Math.max(8, Math.round(btnRect.top - estimatedHeight))

    const docEl = document.documentElement
    docEl.style.setProperty('--songsearch-dd-left', `${left}px`)
    docEl.style.setProperty('--songsearch-dd-top', `${top}px`)
    docEl.style.setProperty('--songsearch-dd-width', `${width}px`)
  }, [])

  useEffect(() => {
    if (openAddFor !== 'footer') return

    const handlePointerDown = (ev: PointerEvent) => {
      const target = ev.target as Node | null
      const dropdown = dropdownRef.current
      const trigger = addToPlBtnRef.current
      if (dropdown?.contains(target) || trigger?.contains(target)) return
      setOpenAddFor(null)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [openAddFor])

  useEffect(() => {
    setOpenAddFor(null)
  }, [location.key])

  useEffect(() => {
    if (openAddFor !== 'footer') return
    const handleReposition = () => positionFooterDropdown()
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition)
    handleReposition()
    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition)
    }
  }, [openAddFor, positionFooterDropdown])

  const findNext = useCallback(
    (from = index) => {
      for (let i = from + 1; i < queue.length; i++) if (queue[i]?.previewUrl) return i
      return null
    },
    [index, queue]
  )

  const findPrev = useCallback(
    (from = index) => {
      for (let i = from - 1; i >= 0; i--) if (queue[i]?.previewUrl) return i
      return null
    },
    [index, queue]
  )

  useEffect(() => {
    if (!open) return
    const el = audioRef.current
    if (!el) return

    const onPlay = () => {
      if (currentAudio && currentAudio !== el && !currentAudio.paused) currentAudio.pause()
      currentAudio = el
      try {
        const t = track
        if (t && (el.currentTime || 0) < 0.5) {
          const MUT = `mutation Increment($trackId: ID!) { incrementTrackListens(trackId: $trackId) { trackId } }`
          void graphqlFetch<{ incrementTrackListens: { trackId: string } }, { trackId: string }>(
            MUT,
            { trackId: String(t.trackId) }
          ).catch((e) => {
            // don't surface errors to UI; log for debugging
            console.error('Failed to increment listens:', e)
          })
        }
      } catch (error) {
        console.error(error)
      }
    }
    const onEnded = () => {
      // If repeat-one is active, restart the same track immediately
      if (repeatMode === 'one') {
        swallow(() => {
          el.currentTime = 0
        })
        void el.play().catch(() => {})
        return
      }
      // playback finished — remove stored resume position for this track
      swallow(() => {
        if (track) removePosition(String(track.trackId ?? track.previewUrl ?? ''))
      })
      const n = findNext(index)
      if (n !== null) {
        playAt(n)
        return
      }
      // If no next track and repeat-mode is 'playlist' for playlist/toptracks, wrap to start
      if (
        repeatMode === 'playlist' &&
        (queueSourceType === 'playlist' || queueSourceType === 'toptracks')
      ) {
        playAt(0)
      }
    }
    const lastSavedRef = { value: 0 } as { value: number }
    const onTime = () => {
      // Don't overwrite UI while user is actively seeking — we show the seek position instead.
      if (seekingRef.current) return
      const t = el.currentTime || 0
      setCurrentTime(t)
      // persist every ~3s of progress (or if it's been more than 3s)
      swallow(() => {
        const key = track ? String(track.trackId ?? track.previewUrl ?? '') : ''
        if (key && Math.abs(t - (lastSavedRef.value || 0)) > 3) {
          setPosition(key, t)
          lastSavedRef.value = t
        }
      })
    }
    const onLoaded = () => {
      setDuration(isFinite(el.duration) ? el.duration : 0)
      // If we have a saved resume position for this track, seek to it now.
      swallow(() => {
        if (!track) return
        const key = String(track.trackId ?? track.previewUrl ?? '')
        if (!restoredFromStorageRef.current && hydrated) {
          const saved = getPosition(key)
          if (saved != null && isFinite(saved) && saved > 0) {
            swallow(() => {
              el.currentTime = saved
            })
            setCurrentTime(saved)
          }
          restoredFromStorageRef.current = true
        }
      })
    }

    const onPauseSave = () => {
      swallow(() => {
        if (!track) return
        const key = String(track.trackId ?? track.previewUrl ?? '')
        const t = el.currentTime || 0
        setPosition(key, t)
      })
    }

    el.addEventListener('play', onPlay)
    el.addEventListener('ended', onEnded)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('pause', onPauseSave)
    const onBeforeUnload = () => {
      swallow(() => {
        if (!track) return
        const key = String(track.trackId ?? track.previewUrl ?? '')
        const t = el.currentTime || 0
        setPosition(key, t)
      })
    }
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('pause', onPauseSave)
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (currentAudio === el) currentAudio = null
    }
  }, [open, index, findNext, playAt, audioRef, track, repeatMode, queueSourceType, hydrated])

  // If the audio element's loadedmetadata fired before the PlayerProvider
  // completed hydration, we might have missed restoring the saved position.
  // Ensure we attempt a restore once when `hydrated` becomes true.
  useEffect(() => {
    if (!track) return
    if (restoredFromStorageRef.current) return
    if (!hydrated) return
    const el = audioRef.current
    if (!el) return
    swallow(() => {
      const key = String(track.trackId ?? track.previewUrl ?? '')
      const saved = getPosition(key)
      if (saved != null && isFinite(saved) && saved > 0) {
        swallow(() => {
          el.currentTime = saved
        })
        setCurrentTime(saved)
      }
    })
    restoredFromStorageRef.current = true
  }, [hydrated, track, audioRef])

  useEffect(() => {
    if (!open) return
    const el = audioRef.current
    if (!el) return
    // Track whether the preview URL changed so we only reset on a new track
    const prevPreview = (prevPreviewRef.current ?? null) as string | null
    const currPreview = track?.previewUrl ?? null
    const isNewTrack = prevPreview !== currPreview

    if (isNewTrack) {
      // new track: reset UI and load the new source. onLoaded will restore saved position if any.
      setCurrentTime(0)
      setDuration(0)
      swallow(() => {
        el.currentTime = 0
      })
      swallow(() => {
        el.load()
      })
    }

    // If playing is true, ensure audio plays; if false, just pause without resetting position.
    if (playing) {
      if (currentAudio && currentAudio !== el && !currentAudio.paused) currentAudio.pause()
      currentAudio = el
      void el.play().catch(() => {})
    } else {
      swallow(() => {
        el.pause()
      })
    }

    prevPreviewRef.current = currPreview
  }, [open, track?.previewUrl, playing, audioRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.getAttribute('contenteditable') === 'true')
      )
        return
      if (e.key === ' ') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'ArrowRight') {
        swallow(() => {
          if (repeatMode === 'one') setRepeatMode('playlist')
        })
        const n = findNext(index)
        if (n !== null) playAt(n)
      }
      if (e.key === 'ArrowLeft') {
        swallow(() => {
          if (repeatMode === 'one') setRepeatMode('playlist')
        })
        const p = findPrev(index)
        if (p !== null) playAt(p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, toggle, findNext, findPrev, playAt, repeatMode, setRepeatMode])

  useEffect(() => {
    if (track) setVisible(true)
  }, [track])

  // Handlers for Prev/Next (extracted so we can use button components)
  const handlePrev = useCallback(() => {
    const el = audioRef.current
    // If we've played more than 5s, restart current track
    if (el && (el.currentTime || 0) > 5) {
      swallow(() => {
        el.currentTime = 0
      })
      swallow(() => {
        el.load()
      })
      void el.play().catch(() => {})
      return
    }

    swallow(() => {
      if (repeatMode === 'one') setRepeatMode('playlist')
    })
    const p = findPrev(index)
    if (p !== null) {
      playAt(p)
      // Ensure new audio element starts from 0
      setTimeout(() => {
        const el2 = audioRef.current
        if (!el2) return
        swallow(() => {
          el2.currentTime = 0
        })
        swallow(() => {
          el2.load()
        })
        void el2.play().catch(() => {})
      }, 50)
      return
    }

    // If no previous but repeat-mode 'playlist', wrap to last
    if (
      repeatMode === 'playlist' &&
      (queueSourceType === 'playlist' || queueSourceType === 'toptracks')
    ) {
      const last = queue.length - 1
      if (last >= 0) {
        playAt(last)
        setTimeout(() => {
          const el2 = audioRef.current
          if (!el2) return
          swallow(() => {
            el2.currentTime = 0
          })
          swallow(() => {
            el2.load()
          })
          void el2.play().catch(() => {})
        }, 50)
      }
    }
  }, [audioRef, findPrev, index, playAt, queue, queueSourceType, repeatMode, setRepeatMode])

  const handleNext = useCallback(() => {
    swallow(() => {
      if (repeatMode === 'one') setRepeatMode('playlist')
    })
    const n = findNext(index)
    if (n !== null) {
      playAt(n)
      // Allow React to update the <audio> src before we reset/play.
      // Use a short timeout so the element has the new source loaded.
      setTimeout(() => {
        const el2 = audioRef.current
        if (!el2) return
        swallow(() => {
          el2.currentTime = 0
        })
        swallow(() => {
          el2.load()
        })
        void el2.play().catch(() => {})
      }, 50)
      return
    }
    // If no next track but repeat-mode is 'playlist' for playlist/toptracks,
    // wrap to start when the user presses Next.
    if (
      repeatMode === 'playlist' &&
      (queueSourceType === 'playlist' || queueSourceType === 'toptracks')
    ) {
      playAt(0)
      setTimeout(() => {
        const el2 = audioRef.current
        if (!el2) return
        swallow(() => {
          el2.currentTime = 0
        })
        swallow(() => {
          el2.load()
        })
        void el2.play().catch(() => {})
      }, 50)
    }
  }, [findNext, index, playAt, audioRef, repeatMode, queueSourceType, setRepeatMode])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    const session = navigator.mediaSession
    if (!session) return

    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // Ignore unsupported handlers (e.g. Safari Desktop)
      }
    }

    if (!track) {
      session.metadata = null
      setHandler('nexttrack', null)
      setHandler('previoustrack', null)
      return
    }

    try {
      session.metadata = new MediaMetadata({
        title: track.trackName ?? 'TuneIn',
        artist: track.artistName ?? '',
        album: track.collectionName ?? '',
        artwork: artwork
          ? [
              {
                src: artwork,
                sizes: '200x200',
                type: 'image/png',
              },
            ]
          : undefined,
      })
    } catch {
      // Ignore metadata errors
    }

    setHandler('play', () => {
      if (!playing) toggle()
    })
    setHandler('pause', () => {
      if (playing) toggle()
    })
    setHandler('nexttrack', () => {
      handleNext()
    })
    setHandler('previoustrack', () => {
      handlePrev()
    })
    return () => {
      setHandler('nexttrack', null)
      setHandler('previoustrack', null)
    }
  }, [artwork, handleNext, handlePrev, playing, toggle, track])

  if (!open) return null

  const progress = duration ? (currentTime / duration) * 100 : 0
  const fmt = (t: number) => {
    if (!isFinite(t) || t < 0) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  /* ---  MOBILE VERSION --- */
  if (isMobile) {
    if (!expanded) {
      return (
        <>
          <section
            className="fp-mini"
            role="button"
            tabIndex={0}
            onClick={() => setExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setExpanded(true)
              }
            }}
            aria-label={`Open player: ${track.trackName} by ${track.artistName}`}
          >
            <img src={artwork} alt="" className="fp-mini-art" />
            <section className="fp-mini-meta">
              <p className="fp-mini-title">{track.trackName}</p>
              <p className="fp-mini-artist">{track.artistName}</p>
            </section>
            <PlayButton
              playing={playing}
              className="fp-mini-play"
              onClick={(e) => {
                e.stopPropagation()
                toggle()
              }}
            />
          </section>

          <audio ref={audioRef} preload="none" className="fp-audio">
            {track.previewUrl && <source src={track.previewUrl} />}
          </audio>
        </>
      )
    }

    // Expanded full-screen mobile player
    return (
      <>
        <section className="fp-overlay" role="dialog" aria-modal="true" aria-labelledby="np-title">
          <article className="fp-expanded">
            <button
              type="button"
              className="fp-btn--close"
              onClick={() => setExpanded(false)}
              aria-label="Close player"
            >
              <FaTimes aria-hidden="true" focusable="false" />
            </button>
            <img src={artwork} alt="" className="fp-expanded-art" />
            <h3 id="np-title">{track.trackName}</h3>
            <p>{track.artistName}</p>
            <nav className="fp-expanded-controls">
              <ShuffleButton shuffle={shuffle} toggleShuffle={toggleShuffle} />
              <PrevButton onPrev={handlePrev} />
              <PlayButton playing={playing} toggle={toggle} />
              <NextButton
                onNext={handleNext}
                disabled={
                  !(
                    findNext(index) !== null ||
                    (repeatMode === 'playlist' &&
                      (queueSourceType === 'playlist' || queueSourceType === 'toptracks'))
                  )
                }
              />
              <RepeatButton
                repeatMode={repeatMode}
                toggleRepeatMode={toggleRepeatMode}
                queueSourceType={queueSourceType}
              />
            </nav>
            <PlayBar
              currentTime={currentTime}
              duration={duration}
              progress={progress}
              barRef={barRef}
              onPointerDownBar={onPointerDownBar}
              onPointerMoveBar={onPointerMoveBar}
              onPointerUpBar={onPointerUpBar}
              fmt={fmt}
            />
          </article>
        </section>

        {/*  Always render audio */}
        <audio ref={audioRef} preload="none" className="fp-audio">
          {track.previewUrl && <source src={track.previewUrl} />}
        </audio>
      </>
    )
  }

  return (
    <section
      role="region"
      aria-label="Now Playing"
      className={`fp-root ${!visible ? 'fp-hidden' : ''}`}
    >
      <section className="fp-left">
        {artwork ? (
          <img className="fp-art" src={artwork} alt="" width={48} height={48} />
        ) : (
          <section className="fp-art fp-art--placeholder" aria-hidden="true" />
        )}

        <section className="fp-meta" aria-live="polite">
          <MarqueeText className="fp-title" text={track.trackName} />

          <MarqueeText
            className="fp-artist"
            text={
              track.collectionName
                ? `${track.artistName} — ${track.collectionName}`
                : track.artistName
            }
          />
        </section>
      </section>

      <section className="fp-middle">
        <nav className="fp-controls" aria-label="Playback controls">
          <ShuffleButton shuffle={shuffle} toggleShuffle={toggleShuffle} />
          <PrevButton onPrev={handlePrev} />
          <PlayButton playing={playing} toggle={toggle} />
          <NextButton
            onNext={handleNext}
            disabled={
              !(
                findNext(index) !== null ||
                (repeatMode === 'playlist' &&
                  (queueSourceType === 'playlist' || queueSourceType === 'toptracks'))
              )
            }
          />
          <RepeatButton
            repeatMode={repeatMode}
            toggleRepeatMode={toggleRepeatMode}
            queueSourceType={queueSourceType}
          />
        </nav>

        <PlayBar
          currentTime={currentTime}
          duration={duration}
          progress={progress}
          barRef={barRef}
          onPointerDownBar={onPointerDownBar}
          onPointerMoveBar={onPointerMoveBar}
          onPointerUpBar={onPointerUpBar}
          fmt={fmt}
        />
      </section>

      <section className="fp-right">
        <audio ref={audioRef} preload="none" className="fp-audio">
          {track.previewUrl && <source src={track.previewUrl} />}
        </audio>

        <button
          type="button"
          className="fp-btn fp-add-btn"
          aria-label={
            justAddedFooter ? `Added ${track.trackName}` : `Add ${track.trackName} to playlist`
          }
          ref={addToPlBtnRef}
          onClick={(e) => {
            e.stopPropagation()
            const btn = e.currentTarget as HTMLElement
            const rect = btn.getBoundingClientRect()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('songsearch:close-filters'))
            }
            setAnchorRect(rect)
            positionFooterDropdown(rect)

            setOpenAddFor((prev) => (prev === 'footer' ? null : 'footer'))
          }}
        >
          {justAddedFooter ? <FaCheck /> : <FaPlus />}
        </button>

        {openAddFor === 'footer' && track && (
          <AddPlaylistModal
            anchorRect={anchorRect}
            dropdownRef={dropdownRef}
            track={track}
            playlists={playlistOptions}
            addToPlaylist={addToPlaylist}
            markJustAdded={() => {
              setJustAddedFooter(true)
              window.setTimeout(() => setJustAddedFooter(false), 1500)
            }}
            setOpenAddFor={setOpenAddFor}
            setShowCreatePl={setShowCreatePl}
            setPendingAddTrack={setPendingAddTrack}
            playing={playing}
            queueSource={queueSourceType}
            appendToQueue={appendToQueue}
          />
        )}

        <CreatePlaylistModal
          show={showCreatePl}
          setShow={(val) => {
            setShowCreatePl(val)
            if (!val) {
              setNewPlName('')
              setPendingAddTrack(null)
            }
          }}
          newPlName={newPlName}
          setNewPlName={setNewPlName}
          inputRef={createInputRef}
          createPlaylist={createPlaylist}
          addToPlaylist={addToPlaylist}
          pendingAddTrack={pendingAddTrack}
          setPendingAddTrack={setPendingAddTrack}
          markJustAdded={() => {
            setJustAddedFooter(true)
            window.setTimeout(() => setJustAddedFooter(false), 1500)
          }}
          creatingPl={creatingPl}
          existingNames={existingPlaylistNames}
        />
      </section>
    </section>
  )
}

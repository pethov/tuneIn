import { test, expect } from '@playwright/test'

// E2E: verify Next/Prev update NowPlaying, and exercise shuffle + repeat playlist wrap

test('Playbar next/prev updates NowPlaying and respects shuffle/repeat playlist', async ({
  page,
}) => {
  // Mock GraphQL playlist response so test is deterministic
  await page.route('**/graphql', async (route, request) => {
    let post: any = {}
    const postData = request.postData()
    if (postData) {
      try {
        post = JSON.parse(postData)
      } catch {
        post = {}
      }
    }
    const query = typeof post?.query === 'string' ? post.query : (post?.operationName ?? '')
    // Debug logging to help diagnose stuck navigation / unexpected requests
    // Playwright Inspector and stdout will show these messages when running with --debug/--headed
    console.log(
      '[e2e] GraphQL request operationName=',
      post?.operationName,
      ' querySnippet=',
      typeof query === 'string' ? query.slice(0, 120) : String(query)
    )

    // If frontend requests a playlist, return a sample with two tracks
    if (query && query.toString().toLowerCase().includes('playlist')) {
      const sample = {
        data: {
          playlist: {
            playlistId: 'pl-test',
            playlistName: 'Playbar Test Playlist',
            tracks: [
              {
                position: 1,
                addedAt: '2020',
                track: {
                  trackId: '1',
                  trackName: 'Song 1',
                  artistName: 'Artist 1',
                  artworkUrl100: '/a.png',
                  previewUrl: '/a.mp3',
                },
              },
              {
                position: 2,
                addedAt: '2020',
                track: {
                  trackId: '2',
                  trackName: 'Song 2',
                  artistName: 'Artist 2',
                  artworkUrl100: '/b.png',
                  previewUrl: '/b.mp3',
                },
              },
            ],
          },
        },
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      })
      return
    }

    // Let other requests continue
    await route.continue()
  })

  // Navigate directly to playlist page
  await page.goto('/playlists/pl-test')

  // Wait for playlist title and track list to render
  await expect(page.locator('h2#pl-title')).toHaveText('Playbar Test Playlist')
  await expect(page.locator('text=Song 1')).toBeVisible()
  await expect(page.locator('text=Song 2')).toBeVisible()

  // Click header Play button (we set ariaLabel "Play/Pause all" in Playlist component)
  const playAll = page.getByRole('button', { name: 'Play/Pause all' })
  await expect(playAll).toBeVisible()
  await playAll.click()

  // Initially NowPlaying should show Song 1
  const nowTitle = page.locator('.fp-title')
  await expect(nowTitle).toHaveAttribute('aria-label', 'Song 1')

  // Click Next -> should show Song 2
  const nextBtn = page.getByRole('button', { name: 'Next' })
  await nextBtn.click()
  await expect(nowTitle).toHaveAttribute('aria-label', 'Song 2')

  // Click Prev -> back to Song 1
  const prevBtn = page.getByRole('button', { name: 'Previous' })
  await prevBtn.click()
  await expect(nowTitle).toHaveAttribute('aria-label', 'Song 1')

  // Toggle shuffle on — target the Now Playing region to avoid hitting the
  // duplicate shuffle control that also exists in the playlist header.
  const nowPlaying = page.getByRole('region', { name: 'Now Playing' })
  const shuffleBtn = nowPlaying.getByRole('button', { name: 'Enable shuffle' })
  await shuffleBtn.click()
  // After shuffle is enabled, Next should still move to some track (with two tracks it will swap)
  await nextBtn.click()
  await expect(nowTitle).toBeVisible()
  // The title should be either Song 1 or Song 2
  const titleText = await nowTitle.getAttribute('aria-label')
  expect(titleText === 'Song 1' || titleText === 'Song 2').toBeTruthy()

  // Ensure repeat playlist wraps from last -> first
  // First, ensure we are on Song 2 (last); if not, move to Song 2
  const current = await nowTitle.getAttribute('aria-label')
  if (current !== 'Song 2') {
    // try to go to Song 2
    await nextBtn.click()
    await expect(nowTitle).toHaveAttribute('aria-label', 'Song 2')
  }

  // Set repeat mode to 'playlist' by clicking RepeatButton until it shows 'Repeat playlist'
  const repeatBtn = page.getByRole('button', { name: /Repeat/ })
  // Click until aria-label indicates playlist mode
  for (let i = 0; i < 3; i++) {
    await repeatBtn.click()
    const aria = await repeatBtn.getAttribute('aria-label')
    if (aria === 'Repeat playlist') break
  }
  await expect(repeatBtn).toHaveAttribute('aria-label', 'Repeat playlist')

  // From Song 2 (last), click Next -> should wrap to Song 1
  await nextBtn.click()
  await expect(nowTitle).toHaveAttribute('aria-label', 'Song 1')
})

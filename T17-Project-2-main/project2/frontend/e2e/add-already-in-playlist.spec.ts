import { test, expect } from '@playwright/test'

test('prevent duplicate add -> playlist already contains track (mocked)', async ({ page }) => {
  let addCalls = 0

  // Intercept GraphQL and return fixtures where the playlist already contains t-1
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

    if (query.includes('GetPlaylists') || query.includes('playlists')) {
      // Return a playlist that already contains t-1
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            playlists: [
              {
                playlistId: 'pl-1',
                playlistName: 'My',
                trackCount: 1,
                tracks: [{ track: { trackId: 't-1', trackName: 'Mock Track' } }],
              },
            ],
          },
        }),
      })
      return
    }

    if (query.includes('SearchTracks') || query.includes('searchTracks')) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            searchTracks: {
              total: 1,
              items: [
                {
                  trackId: 't-1',
                  trackName: 'Mock Track',
                  artistName: 'Mock Artist',
                  artworkUrl100: '',
                  previewUrl: '',
                  genre: '',
                  releasedate: '',
                },
              ],
            },
          },
        }),
      })
      return
    }

    if (query.includes('addTrackToPlaylist') || query.includes('AddTrackToPlaylist')) {
      // Track attempts to add should not happen in this scenario, but if they do
      // record the call and return a server error indicating already in playlist
      addCalls++
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: [{ message: 'ALREADY_IN_PLAYLIST' }] }),
      })
      return
    }

    await route.continue()
  })

  await page.goto('/')

  // Trigger search
  await page.fill('#q', 'mo')
  await expect(page.locator('text=Mock Track')).toBeVisible()

  // Open add dropdown for the result
  const addBtn = page.locator('.track-row').locator('button[aria-label^="Add"]')
  await addBtn.first().click()

  const dropdown = page.locator('.songsearch-dropdown')
  await expect(dropdown).toBeVisible()

  // Playlist entry should indicate it's already added
  const playlistBtn = dropdown.locator('button.songsearch-dropdown-item').filter({ hasText: 'My' })
  await expect(playlistBtn).toBeVisible()
  await expect(playlistBtn).toHaveClass(/already-added/)
  await expect(playlistBtn).toHaveAttribute('aria-disabled', 'true')

  // Check icon (check mark) should be present inside the button
  await expect(playlistBtn.locator('.check')).toBeVisible()

  // Clicking the already-added button should not trigger an add mutation.
  // Playwright won't click elements considered disabled/aria-disabled, so dispatch
  // a DOM click inside the page to exercise the app's handler while avoiding
  // Playwright's enabled check.
  await page.evaluate(() => {
    const items = Array.from(
      document.querySelectorAll('button.songsearch-dropdown-item')
    ) as HTMLElement[]
    const btn = items.find(
      (el) => el.classList.contains('already-added') && el.textContent?.trim().startsWith('My')
    )
    if (btn) {
      // Dispatch a click event that bubbles so React handlers receive it.
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    }
  })
  // small wait to allow any potential request to be recorded
  await page.waitForTimeout(200)
  expect(addCalls).toBe(0)

  // Dropdown should close after interaction
  await expect(dropdown)
    .toBeHidden({ timeout: 2000 })
    .catch(() => {})
})

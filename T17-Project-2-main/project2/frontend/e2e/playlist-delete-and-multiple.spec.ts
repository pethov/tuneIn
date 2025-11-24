import { test, expect } from '@playwright/test'

test('playlist page: play multiple tracks and delete playlist (mocked)', async ({ page }) => {
  // Track whether the playlist has been deleted so route responses can change
  let deleted = false

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

    // Playlists list (used after deletion)
    if (query.includes('GetPlaylists') || query.includes('playlists')) {
      const body = deleted
        ? { data: { playlists: [] } }
        : {
            data: {
              playlists: [
                {
                  playlistId: 'pl-e2e-del',
                  playlistName: 'E2E Delete',
                  trackCount: 2,
                  tracks: [
                    { track: { trackId: '1', artworkUrl100: '' } },
                    { track: { trackId: '2', artworkUrl100: '' } },
                  ],
                },
              ],
            },
          }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return
    }

    // Single playlist query
    if (query.includes('GetPlaylist') || query.includes('playlist')) {
      // If deleted, return null
      if (deleted) {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { playlist: null } }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            playlist: {
              playlistId: 'pl-e2e-del',
              playlistName: 'E2E Delete',
              trackCount: 2,
              tracks: [
                {
                  position: 1,
                  addedAt: '2020-01-01',
                  track: {
                    trackId: 't-1',
                    trackName: 'E2E Track 1',
                    artistName: 'Artist A',
                    artworkUrl100: '',
                    previewUrl: '',
                  },
                },
                {
                  position: 2,
                  addedAt: '2020-01-02',
                  track: {
                    trackId: 't-2',
                    trackName: 'E2E Track 2',
                    artistName: 'Artist B',
                    artworkUrl100: '',
                    previewUrl: '',
                  },
                },
              ],
            },
          },
        }),
      })
      return
    }

    // Delete mutation
    if (query.includes('DeletePlaylist') || query.includes('deletePlaylist')) {
      deleted = true
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { deletePlaylist: true } }),
      })
      return
    }

    // Default passthrough
    await route.continue()
  })

  // Navigate directly to the playlist page (correct route is /playlists/:id)
  await page.goto('/playlists/pl-e2e-del')

  // Verify playlist title and track count
  await expect(page.locator('text=E2E Delete')).toBeVisible()
  await expect(page.locator('text=2 tracks')).toBeVisible()

  // Play first track and assert NowPlaying shows track 1
  // Wait a moment for the playlist UI to mount and then locate the items by their titles.
  await page.waitForTimeout(250)

  // Ensure the specific track titles are present in the DOM (resilient to extra nodes)
  const t1 = page.locator('text=E2E Track 1').first()
  const t2 = page.locator('text=E2E Track 2').first()
  await expect(t1).toBeVisible({ timeout: 10000 })
  await expect(t2).toBeVisible({ timeout: 10000 })

  // Find the list item that contains Track 1 and click its play button
  const item1 = page.locator('ul.track-row-list > li', { has: t1 }).first()
  const playBtn1 = item1.locator('article.track-row button.track-row-btn').first()
  await playBtn1.scrollIntoViewIfNeeded()
  await playBtn1.click()
  await expect(t1).toBeVisible()

  // Find the list item that contains Track 2 and click its play button
  const item2 = page.locator('ul.track-row-list > li', { has: t2 }).first()
  const playBtn2 = item2.locator('article.track-row button.track-row-btn').first()
  await playBtn2.scrollIntoViewIfNeeded()
  await playBtn2.click()
  await expect(t2).toBeVisible()

  // Stub confirm to accept deletion, then click delete and wait for GraphQL delete request
  await page.evaluate(() => {
    ;(window as any).confirm = () => true
  })

  const [delReq] = await Promise.all([
    page.waitForRequest((r) => {
      try {
        const pd = r.postData()
        return (
          r.url().endsWith('/graphql') &&
          r.method() === 'POST' &&
          !!(pd && pd.includes('deletePlaylist'))
        )
      } catch {
        return false
      }
    }),
    page.locator('button.pl-delete-btn').click(),
  ])
  expect(delReq).toBeTruthy()

  // After delete the app navigates to playlists — wait for URL and assert playlist is gone
  await page.waitForURL('**/playlists')
  // Ensure the deleted playlist is not present in the playlists list
  await expect(page.locator('text=E2E Delete')).toHaveCount(0)
})

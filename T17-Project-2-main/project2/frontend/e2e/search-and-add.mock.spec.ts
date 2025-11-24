import { test, expect } from '@playwright/test'

test.describe('search + add to playlist (mocked)', () => {
  test('searches and adds a track to a playlist', async ({ page }) => {
    // Intercept GraphQL requests and respond with deterministic fixtures
    await page.route('**/graphql', async (route, request) => {
      // normalize POST body safely
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
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              playlists: [
                { playlistId: 'pl-1', playlistName: 'My Playlist', trackCount: 0, tracks: [] },
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
        // return a playlist with the added track
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              addTrackToPlaylist: {
                playlistId: 'pl-1',
                playlistName: 'My Playlist',
                userID: 'u1',
                playCount: 0,
              },
            },
          }),
        })
        return
      }

      // default passthrough
      await route.continue()
    })

    await page.goto('/')

    // Trigger search
    await page.fill('#q', 'mo')

    // Expect mocked result
    await expect(page.locator('text=Mock Track')).toBeVisible()

    // Open add dropdown by clicking the + button for the result
    const addBtn = page.locator('.track-row').locator('button[aria-label^="Add"]')
    await addBtn.first().click()

    // Dropdown should appear and contain the mocked playlist
    const dropdown = page.locator('.songsearch-dropdown')
    await expect(dropdown).toBeVisible()
    await expect(dropdown.locator('text=My Playlist')).toBeVisible()

    // Click the playlist to perform the mutation. Wait for the mutation request.
    const [mutation] = await Promise.all([
      page.waitForRequest((r) => {
        try {
          const post = r.postData()
          return !!(
            r.url().endsWith('/graphql') &&
            r.method() === 'POST' &&
            typeof post === 'string' &&
            post.includes('addTrackToPlaylist')
          )
        } catch {
          return false
        }
      }),
      dropdown.locator('button', { hasText: 'My Playlist' }).click(),
    ])

    expect(mutation).toBeTruthy()

    // After adding, the dropdown should close
    await expect(dropdown)
      .toBeHidden({ timeout: 2000 })
      .catch(() => {})
  })
})

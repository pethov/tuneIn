import { test, expect } from '@playwright/test'

test('search -> create playlist -> add track -> play (mocked)', async ({ page }) => {
  // Intercept GraphQL and respond with fixtures for the scenario
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
      // initially no playlists
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { playlists: [] } }),
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
                  trackId: 't-xyz',
                  trackName: 'E2E Track',
                  artistName: 'E2E Artist',
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

    if (query.includes('CreatePlaylist') || query.includes('createPlaylist')) {
      // simulate created playlist id
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { createPlaylist: { playlistId: 'pl-e2e-1', playlistName: 'E2E New' } },
        }),
      })
      return
    }

    if (
      query.includes('addTrackToPlaylist') ||
      query.includes('AddTrackToPlaylist') ||
      query.includes('addToPlaylist')
    ) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { addTrackToPlaylist: { playlistId: 'pl-e2e-1', playlistName: 'E2E New' } },
        }),
      })
      return
    }

    // default: passthrough
    await route.continue()
  })

  // Start at app
  await page.goto('/')

  // Search for the track
  await page.fill('#q', 'e2e')
  await expect(page.locator('text=E2E Track')).toBeVisible()

  // Open add dropdown for first result
  const addBtn = page.locator('.track-row').locator('button[aria-label^="Add"]')
  await addBtn.first().click()

  // Click "New Playlist" (aria-label "Make new playlist")
  const newPlBtn = page.locator('button[aria-label="Make new playlist"]')
  await expect(newPlBtn).toBeVisible()
  await newPlBtn.click()

  // Modal should appear; fill name and submit
  const nameInput = page.locator('input[aria-label="New playlist name"]')
  await expect(nameInput).toBeVisible()
  await nameInput.fill('E2E New')

  // Intercept createPlaylist request and addToPlaylist request by waiting
  const [createReq] = await Promise.all([
    page.waitForRequest((r) => {
      try {
        const pd = r.postData()
        return (
          r.url().endsWith('/graphql') &&
          r.method() === 'POST' &&
          !!(pd && pd.includes('createPlaylist'))
        )
      } catch {
        return false
      }
    }),
    page.click('button:has-text("Create")'),
  ])
  expect(createReq).toBeTruthy()

  // After create, CreatePlaylistModal will automatically call addToPlaylist if a pending track was set.
  // Wait for the addToPlaylist GraphQL request instead of expecting the dropdown to re-open.
  const addReq = await page.waitForRequest(
    (r) => {
      try {
        const pd = r.postData()
        return (
          r.url().endsWith('/graphql') &&
          r.method() === 'POST' &&
          !!(pd && (pd.includes('addTrackToPlaylist') || pd.includes('addToPlaylist')))
        )
      } catch {
        return false
      }
    },
    { timeout: 5000 }
  )
  expect(addReq).toBeTruthy()

  // After adding, dropdown should hide; try to play the track by clicking its play button
  const playBtn = page.locator('.track-row').locator('button[aria-label^="Play"]')
  await playBtn.first().click()

  // The track title should be visible somewhere (NowPlayingFooter or track element)
  await expect(page.locator('text=E2E Track').first()).toBeVisible()
})

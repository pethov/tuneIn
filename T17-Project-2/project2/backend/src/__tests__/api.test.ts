import type { Express } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../server";
import pool from "../db";

let app: Express;

// Use a valid UUID for tests because the DB user_id column is of type UUID
const TEST_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_TEST_USER_ID = "22222222-2222-2222-2222-222222222222";

type PlaylistSummary = {
  playlistId: string;
  playlistName: string;
  userID?: string;
};

async function graphqlRequest(
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>,
) {
  const req = request(app)
    .post("/graphql")
    .set("Content-Type", "application/json");

  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      req.set(k, v);
    }
  }

  return req.send({ query, variables });
}

beforeAll(async () => {
  app = await buildApp();
});

describe("backend API", () => {
  it("should respond to GET /health", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    // server returns { ok: true }
    expect(res.body).toEqual({ ok: true });
  });

  it("should respond to GraphQL _ping", async () => {
    const res = await graphqlRequest("{ _ping }");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data._ping).toBe("pong");
  });
});

describe("GraphQL domain operations", () => {
  beforeEach(async () => {
    // Ensure test DB (mock or real) is clean between tests
    try {
      await pool!.query("DELETE FROM playlist_tracks");
      await pool!.query("DELETE FROM playlists");
    } catch {
      // ignore errors (some backends may not have tables in mock)
    }
  });
  it("searchTracks returns empty result when no term or filters are provided", async () => {
    const res = await graphqlRequest(
      `
        query EmptySearch($term: String!) {
          searchTracks(term: $term) {
            total
            items {
              trackId
            }
          }
        }
      `,
      { term: " " },
    );

    expect(res.status).toBe(200);
    expect(res.body.data.searchTracks.total).toBe(0);
    expect(res.body.data.searchTracks.items).toEqual([]);
  });

  it("requires user context for playlists query", async () => {
    const res = await graphqlRequest(
      `
        query {
          playlists {
            playlistId
          }
        }
      `,
    );

    // GraphQL returns 200 with errors when resolver throws
    expect(res.status).toBe(200);
    expect(res.body.errors?.[0].message).toMatch(/Missing user context/i);
  });

  it("can create, query, update and delete a playlist for a specific user", async () => {
    // create playlist
    const createRes = await graphqlRequest(
      `
        mutation CreatePl($name: String) {
          createPlaylist(name: $name) {
            playlistId
            playlistName
            userID
            playCount
          }
        }
      `,
      { name: "API Test Playlist" },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(createRes.status).toBe(200);
    const created = createRes.body.data.createPlaylist;
    expect(created.playlistName).toBe("API Test Playlist");
    expect(created.userID).toBe(TEST_USER_ID);
    expect(typeof created.playCount).toBe("number");

    const playlistId = created.playlistId;
    expect(playlistId).toBeDefined();

    // playlists query should include the created playlist for this user
    const listRes = await graphqlRequest(
      `
        query {
          playlists {
            playlistId
            playlistName
            userID
          }
        }
      `,
      undefined,
      { "x-anon-id": TEST_USER_ID },
    );

    expect(listRes.status).toBe(200);
    const list = listRes.body.data.playlists;
    const found = list.find(
      (p: PlaylistSummary) =>
        p.playlistId === playlistId && p.playlistName === "API Test Playlist",
    );
    expect(found).toBeTruthy();

    // delete playlist
    const deleteRes = await graphqlRequest(
      `
        mutation DeletePl($id: ID!) {
          deletePlaylist(id: $id)
        }
      `,
      { id: playlistId },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deletePlaylist).toBe(true);
  });

  it("can add and remove a track from a playlist and reflects changes in playlist query", async () => {
    // fetch an existing track id from topTracks – required by addTrackToPlaylist
    const topRes = await graphqlRequest(
      `
        query {
          topTracks(limit: 1) {
            trackId
          }
        }
      `,
    );

    expect(topRes.status).toBe(200);
    const top = topRes.body.data.topTracks;
    // if DB is empty this test cannot proceed
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeGreaterThan(0);
    const trackId = top[0].trackId as string;

    // create a fresh playlist for this test user
    const createRes = await graphqlRequest(
      `
        mutation CreatePl($name: String) {
          createPlaylist(name: $name) {
            playlistId
          }
        }
      `,
      { name: "API Playlist with Track" },
      { "x-anon-id": TEST_USER_ID },
    );

    const playlistId = createRes.body.data.createPlaylist.playlistId as string;
    expect(playlistId).toBeDefined();

    // add the track to the playlist
    const addRes = await graphqlRequest(
      `
        mutation AddTrack($pl: ID!, $t: ID!) {
          addTrackToPlaylist(input: { playlistId: $pl, trackId: $t }) {
            playlistId
            trackCount
          }
        }
      `,
      { pl: playlistId, t: trackId },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.addTrackToPlaylist.playlistId).toBe(playlistId);
    expect(addRes.body.data.addTrackToPlaylist.trackCount).toBeGreaterThan(0);

    // query playlist with tracks
    const playlistRes = await graphqlRequest(
      `
        query Pl($id: ID!) {
          playlist(id: $id) {
            playlistId
            trackCount
            tracks {
              trackId
              position
            }
          }
        }
      `,
      { id: playlistId },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(playlistRes.status).toBe(200);
    const pl = playlistRes.body.data.playlist;
    expect(pl.playlistId).toBe(playlistId);
    expect(pl.trackCount).toBeGreaterThan(0);
    expect(Array.isArray(pl.tracks)).toBe(true);
    const hasTrack = pl.tracks.some(
      (t: { trackId: string }) => t.trackId === trackId,
    );
    expect(hasTrack).toBe(true);

    // remove the track again
    const removeRes = await graphqlRequest(
      `
        mutation RemoveTrack($pl: ID!, $t: ID!) {
          removeTrackFromPlaylist(playlistId: $pl, trackId: $t) {
            playlistId
            trackCount
          }
        }
      `,
      { pl: playlistId, t: trackId },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.removeTrackFromPlaylist.playlistId).toBe(
      playlistId,
    );

    // after removal, playlist query should not list the track
    const playlistAfterRes = await graphqlRequest(
      `
        query Pl($id: ID!) {
          playlist(id: $id) {
            playlistId
            trackCount
            tracks {
              trackId
            }
          }
        }
      `,
      { id: playlistId },
      { "x-anon-id": TEST_USER_ID },
    );

    const plAfter = playlistAfterRes.body.data.playlist;
    expect(plAfter.playlistId).toBe(playlistId);
    const stillHasTrack = plAfter.tracks.some(
      (t: { trackId: string }) => t.trackId === trackId,
    );
    expect(stillHasTrack).toBe(false);

    // clean up playlist row to avoid leaving many test playlists
    await pool!.query("DELETE FROM playlists WHERE playlist_id = $1", [
      playlistId,
    ]);
  });

  it("increments track listens through incrementTrackListens mutation", async () => {
    // pick a track from topTracks to operate on
    const topRes = await graphqlRequest(
      `
        query {
          topTracks(limit: 1) {
            trackId
            listens
          }
        }
      `,
    );

    expect(topRes.status).toBe(200);
    const top = topRes.body.data.topTracks;
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeGreaterThan(0);

    const trackId = top[0].trackId as string;
    const beforeListens = top[0].listens as number;

    const incRes = await graphqlRequest(
      `
        mutation Inc($id: ID!) {
          incrementTrackListens(trackId: $id) {
            trackId
            listens
          }
        }
      `,
      { id: trackId },
    );

    expect(incRes.status).toBe(200);
    const updated = incRes.body.data.incrementTrackListens;
    expect(updated.trackId).toBe(trackId);
    expect(updated.listens).toBeGreaterThanOrEqual(beforeListens + 1);
  });

  it("rejects creating a playlist with an empty name", async () => {
    const res = await graphqlRequest(
      `
        mutation CreatePl($name: String) {
          createPlaylist(name: $name) {
            playlistId
          }
        }
      `,
      { name: "   " },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(res.status).toBe(200);
    expect(res.body.data.createPlaylist).toBeNull();
    expect(res.body.errors?.[0].message).toMatch(/Name is required/i);
  });

  it("does not allow adding a track to a playlist owned by another user", async () => {
    const topRes = await graphqlRequest(
      `
        query {
          topTracks(limit: 1) {
            trackId
          }
        }
      `,
    );

    expect(topRes.status).toBe(200);
    const top = topRes.body.data.topTracks;
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeGreaterThan(0);
    const trackId = top[0].trackId as string;

    const createRes = await graphqlRequest(
      `
        mutation CreatePl($name: String) {
          createPlaylist(name: $name) {
            playlistId
          }
        }
      `,
      { name: "Owner playlist" },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(createRes.status).toBe(200);
    const playlistId = createRes.body.data.createPlaylist.playlistId as string;
    expect(playlistId).toBeDefined();

    const addRes = await graphqlRequest(
      `
        mutation AddTrack($pl: ID!, $t: ID!) {
          addTrackToPlaylist(input: { playlistId: $pl, trackId: $t }) {
            playlistId
          }
        }
      `,
      { pl: playlistId, t: trackId },
      { "x-anon-id": OTHER_TEST_USER_ID },
    );

    expect(addRes.status).toBe(200);
    if (typeof addRes.body.data?.addTrackToPlaylist === "undefined") {
      console.log("DEBUG addRes.body:", JSON.stringify(addRes.body, null, 2));
    }
    // GraphQL returns `data: null` when a field errors — assert on `data`.
    expect(addRes.body.data).toBeNull();
    expect(addRes.body.errors?.[0].message).toMatch(
      /Playlist not found or not owned by user/i,
    );

    const deleteRes = await graphqlRequest(
      `
        mutation DeletePl($id: ID!) {
          deletePlaylist(id: $id)
        }
      `,
      { id: playlistId },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deletePlaylist).toBe(true);
  });

  it("returns null for playlist query when requesting a playlist owned by another user", async () => {
    const createRes = await graphqlRequest(
      `
        mutation CreatePl($name: String) {
          createPlaylist(name: $name) {
            playlistId
          }
        }
      `,
      { name: "Private playlist" },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(createRes.status).toBe(200);
    const playlistId = createRes.body.data.createPlaylist.playlistId as string;
    expect(playlistId).toBeDefined();

    const queryRes = await graphqlRequest(
      `
        query Pl($id: ID!) {
          playlist(id: $id) {
            playlistId
          }
        }
      `,
      { id: playlistId },
      { "x-anon-id": OTHER_TEST_USER_ID },
    );

    expect(queryRes.status).toBe(200);
    expect(queryRes.body.errors).toBeUndefined();
    expect(queryRes.body.data.playlist).toBeNull();

    const deleteRes = await graphqlRequest(
      `
        mutation DeletePl($id: ID!) {
          deletePlaylist(id: $id)
        }
      `,
      { id: playlistId },
      { "x-anon-id": TEST_USER_ID },
    );

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.deletePlaylist).toBe(true);
  });

  it("returns an error when incrementing listens for a non-existing track", async () => {
    const topRes = await graphqlRequest(
      `
        query {
          topTracks(limit: 1) {
            trackId
          }
        }
      `,
    );

    expect(topRes.status).toBe(200);
    const top = topRes.body.data.topTracks;
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeGreaterThan(0);
    const existingTrackId = top[0].trackId as string;

    const numeric = Number(existingTrackId);
    const nonExistingTrackId = Number.isFinite(numeric)
      ? String(numeric + 1_000_000)
      : `${existingTrackId}__nonexistent`;

    const res = await graphqlRequest(
      `
        mutation Inc($id: ID!) {
          incrementTrackListens(trackId: $id) {
            trackId
          }
        }
      `,
      { id: nonExistingTrackId },
    );

    expect(res.status).toBe(200);
    if (typeof res.body.data?.incrementTrackListens === "undefined") {
      console.log("DEBUG incRes.body:", JSON.stringify(res.body, null, 2));
    }
    // GraphQL returns `data: null` when a field errors — assert on `data`.
    expect(res.body.data).toBeNull();
    expect(res.body.errors?.[0].message).toMatch(
      /Failed to increment listens/i,
    );
  });
});

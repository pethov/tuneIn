import pool from "../../../src/db";

export type Ctx = { userId?: string };

export function requireUserId(ctx: Ctx): string {
  const id = ctx?.userId;
  if (!id || typeof id !== "string" || !id.trim()) {
    throw new Error("Missing user context (x-anon-id header)");
  }
  return id;
}

// Small helper to fetch the current state of a playlist header.
export async function fetchPlaylistRow(playlistId: string) {
  const { rows } = await pool.query(
    `SELECT playlist_id, playlist_name, user_id, plays_count
       FROM playlists
      WHERE playlist_id = $1`,
    [playlistId],
  );
  if (!rows[0]) return null;
  return {
    playlistId: rows[0].playlist_id,
    playlistName: rows[0].playlist_name,
    userID: rows[0].user_id,
    playCount: rows[0].plays_count ?? 0,
  };
}

// Shared implementation for removing a track from a playlist (used by multiple mutations).
export async function removeTrackImpl(
  playlistId: string,
  trackId: string,
  ctx: Ctx,
) {
  const userId = requireUserId(ctx);

  const { rows: own } = await pool.query(
    `SELECT 1 FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
    [playlistId, userId],
  );
  if (!own[0]) throw new Error("Playlist not found or not owned by user");

  await pool.query("BEGIN");
  try {
    const { rows: posRows } = await pool.query(
      `SELECT position
         FROM playlist_tracks
        WHERE playlist_id = $1 AND trackid = $2`,
      [playlistId, trackId],
    );

    const pos: number | undefined = posRows[0]?.position;
    if (pos == null) {
      await pool.query("COMMIT");
      return fetchPlaylistRow(String(playlistId));
    }

    await pool.query(
      `DELETE FROM playlist_tracks
        WHERE playlist_id = $1 AND trackid = $2`,
      [playlistId, trackId],
    );

    await pool.query(
      `UPDATE playlist_tracks
          SET position = position - 1
        WHERE playlist_id = $1
          AND position > $2`,
      [playlistId, pos],
    );

    await pool.query("COMMIT");
    return fetchPlaylistRow(String(playlistId));
  } catch (e) {
    await pool.query("ROLLBACK");
    console.error("removeTrack error:", e);
    throw new Error("Failed to remove track");
  }
}

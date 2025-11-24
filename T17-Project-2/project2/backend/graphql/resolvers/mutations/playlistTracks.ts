import pool from "../../../src/db";
import {
  Ctx,
  requireUserId,
  fetchPlaylistRow,
  removeTrackImpl,
} from "../shared/helpers";

// Mutations that add/remove tracks inside a playlist while keeping positions consistent.
export const Mutation = {
  async addTrackToPlaylist(
    _: unknown,
    { input }: { input?: Record<string, unknown> },
    ctx: Ctx,
  ) {
    const userId = requireUserId(ctx);

    // Accept multiple casing conventions since the frontend evolved over time.
    const playlistId =
      (input && (input as any).playlistId) ??
      (input && (input as any).playlist_id) ??
      (input && (input as any).playlistid);
    const trackId =
      (input && (input as any).trackId) ??
      (input && (input as any).trackid) ??
      (input && (input as any).track_id);
    const position = (input && (input as any).position) ?? undefined;

    if (!playlistId || !trackId) {
      throw new Error("playlistId and trackId are required");
    }

    const { rows: own } = await pool.query(
      `SELECT 1 FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
      [playlistId, userId],
    );
    if (!own[0]) {
      throw new Error("Playlist not found or not owned by user");
    }

    await pool.query("BEGIN");
    try {
      let pos = position as number | undefined;
      if (pos == null) {
        // Append by default: get next index for the playlist.
        const { rows } = await pool.query(
          `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
             FROM playlist_tracks
            WHERE playlist_id = $1`,
          [playlistId],
        );
        pos = rows[0].next_pos;
      } else {
        // Inserting at a specific position? Shift subsequent records down first.
        await pool.query(
          `UPDATE playlist_tracks
              SET position = position + 1
            WHERE playlist_id = $1
              AND position >= $2`,
          [playlistId, pos],
        );
      }

      await pool.query(
        `INSERT INTO playlist_tracks (playlist_id, trackid, position)
           VALUES ($1, $2, $3)
         ON CONFLICT (playlist_id, trackid)
         DO UPDATE SET position = EXCLUDED.position`,
        [playlistId, trackId, pos],
      );

      await pool.query("COMMIT");
      return fetchPlaylistRow(String(playlistId));
    } catch (e) {
      await pool.query("ROLLBACK");
      console.error("addTrackToPlaylist error:", e);
      throw e;
    }
  },

  async removeTrackFromPlaylist(
    _: unknown,
    { playlistId, trackId }: { playlistId: string; trackId: string },
    ctx: Ctx,
  ) {
    return removeTrackImpl(playlistId, trackId, ctx);
  },
};

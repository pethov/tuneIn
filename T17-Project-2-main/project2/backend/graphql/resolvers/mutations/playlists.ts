import pool from "../../../src/db";
import { Ctx, requireUserId } from "../shared/helpers";

// Playlist CRUD mutations. All of them ensure the authenticated user owns the target record.
export const Mutation = {
  async createPlaylist(_: unknown, { name }: { name: string }, ctx: Ctx) {
    const userId = requireUserId(ctx);
    try {
      if (!name || !name.trim()) throw new Error("Name is required");
      const trimmed = name.trim();

      // Guard against duplicate names per user (case-insensitive).
      const existing = await pool.query(
        `SELECT playlist_id
           FROM playlists
          WHERE user_id = $1
            AND LOWER(playlist_name) = LOWER($2)
          LIMIT 1`,
        [userId, trimmed],
      );
      if ((existing.rowCount ?? 0) > 0) {
        throw new Error("A playlist with that name already exists");
      }

      const { rows } = await pool.query(
        `INSERT INTO playlists (user_id, playlist_name, plays_count)
         VALUES ($1, $2, 0)
         RETURNING playlist_id, playlist_name, user_id, plays_count`,
        [userId, trimmed],
      );

      const row = rows?.[0];
      if (!row) throw new Error("Insert returned no row");

      return {
        playlistId: row.playlist_id,
        playlistName: row.playlist_name,
        userID: row.user_id,
        playCount: row.plays_count ?? 0,
      };
    } catch (err) {
      console.error("createPlaylist error:", err);
      throw new Error("Failed to create playlist: " + (err as Error).message);
    }
  },

  async deletePlaylist(_: unknown, { id }: { id: string }, ctx: Ctx) {
    const userId = requireUserId(ctx);
    try {
      const res = await pool.query(
        `DELETE FROM playlists
          WHERE playlist_id = $1
            AND user_id = $2`,
        [id, userId],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error("deletePlaylist error:", err);
      throw new Error("Failed to delete playlist: " + (err as Error).message);
    }
  },
};

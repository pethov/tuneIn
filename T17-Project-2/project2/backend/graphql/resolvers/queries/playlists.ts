import pool from "../../../src/db";
import { Ctx, requireUserId } from "../shared/helpers";

// Returns the list of playlists owned by the current user; used on the library/home views.
export const Query = {
  async playlists(_: unknown, __: unknown, ctx: Ctx) {
    const userId = requireUserId(ctx);
    const { rows } = await pool.query(
      `SELECT playlist_id, playlist_name, user_id, plays_count
         FROM playlists
        WHERE user_id = $1
        ORDER BY playlist_name ASC`,
      [userId],
    );
    return rows.map((r) => ({
      playlistId: r.playlist_id,
      playlistName: r.playlist_name,
      userID: r.user_id,
      playCount: r.plays_count ?? 0,
    }));
  },
};

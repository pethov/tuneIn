import pool from "../../../src/db";
import { Ctx, requireUserId } from "../shared/helpers";

// Fetches a single playlist header for the authenticated user; track rows are resolved separately.
export const Query = {
  async playlist(_: unknown, { id }: { id: string }, ctx: Ctx) {
    const userId = requireUserId(ctx);
    const { rows } = await pool.query(
      `SELECT playlist_id, playlist_name, user_id, plays_count
         FROM playlists
        WHERE playlist_id = $1
          AND user_id = $2`,
      [id, userId],
    );
    if (!rows[0]) return null;
    return {
      playlistId: rows[0].playlist_id,
      playlistName: rows[0].playlist_name,
      userID: rows[0].user_id,
      playCount: rows[0].plays_count ?? 0,
    };
  },
};

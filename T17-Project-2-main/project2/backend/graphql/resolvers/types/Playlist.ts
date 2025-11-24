import pool from "../../../src/db";
import { Ctx, requireUserId } from "../shared/helpers";

// Field resolvers for the Playlist GraphQL type (tracks, derived counts, etc.).
const Playlist = {
  userID: (p: any) => p.userID ?? p.user_id,
  playCount: (p: any) => p.playCount ?? p.plays_count ?? 0,

  async tracks(parent: { playlistId?: string }, _: unknown, ctx: Ctx) {
    const userId = requireUserId(ctx);
    const playlistId = parent.playlistId;
    if (!playlistId) return [];

    const { rows: ownerRows } = await pool.query(
      `SELECT 1 FROM playlists WHERE playlist_id = $1 AND user_id = $2`,
      [playlistId, userId],
    );
    if (!ownerRows[0]) return [];

    const { rows } = await pool.query(
      `SELECT pt.position, pt.added_at,
              t.trackid, t.trackname, t.artistname,
              t.collectionname, t.artworkurl100, t.previewurl,
              t.genre, t.releasedate
         FROM playlist_tracks pt
         JOIN track t ON t.trackid = pt.trackid
        WHERE pt.playlist_id = $1
        ORDER BY pt.position ASC`,
      [playlistId],
    );

    return rows.map((r: any) => ({
      trackId: String(r.trackid),
      position: r.position,
      addedAt: r.added_at,
      track: {
        trackId: String(r.trackid),
        trackName: r.trackname,
        artistName: r.artistname,
        collectionName: r.collectionname ?? null,
        artworkUrl100: r.artworkurl100 ?? null,
        previewUrl: r.previewurl ?? null,
        genre: r.genre ?? null,
        releasedate: r.releasedate ?? null,
      },
    }));
  },

  async trackCount(parent: { playlistId?: string }) {
    const playlistId = parent.playlistId;
    if (!playlistId) return 0;

    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
         FROM playlist_tracks
        WHERE playlist_id = $1`,
      [playlistId],
    );

    return rows[0]?.count ?? 0;
  },
};

export default Playlist;

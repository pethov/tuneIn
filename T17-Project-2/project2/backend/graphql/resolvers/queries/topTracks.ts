import pool from "../../../src/db";

// Simple leaderboard query used on the home dashboard.
export const Query = {
  async topTracks(_: unknown, { limit = 10 }: { limit?: number }) {
    const { rows } = await pool.query(
      `SELECT trackid, trackname, artistname, collectionname, artworkurl100, previewurl, genre, releasedate, listens
         FROM track
        ORDER BY listens DESC NULLS LAST, trackname ASC
        LIMIT $1`,
      [limit],
    );
    return (rows || []).map((r: any) => ({
      trackId: String(r.trackid),
      trackName: r.trackname,
      artistName: r.artistname,
      collectionName: r.collectionname ?? null,
      artworkUrl100: r.artworkurl100 ?? null,
      previewUrl: r.previewurl ?? null,
      genre: r.genre ?? null,
      releasedate: r.releasedate ?? null,
      listens: typeof r.listens === "number" ? r.listens : 0,
    }));
  },
};

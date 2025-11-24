import pool from "../../../src/db";

// Track-specific mutations. Currently only exposes the listens counter.
export const Mutation = {
  async incrementTrackListens(_: unknown, { trackId }: { trackId: string }) {
    if (!trackId) throw new Error("trackId required");
    try {
      const { rows } = await pool.query(
        `UPDATE track SET listens = COALESCE(listens, 0) + 1
           WHERE trackid = $1
        RETURNING trackid, trackname, artistname, collectionname, artworkurl100, previewurl, genre, releasedate, listens`,
        [trackId],
      );
      const r = rows?.[0];
      if (!r) throw new Error("Track not found");
      return {
        trackId: String(r.trackid),
        trackName: r.trackname,
        artistName: r.artistname,
        collectionName: r.collectionname ?? null,
        artworkUrl100: r.artworkurl100 ?? null,
        previewUrl: r.previewurl ?? null,
        genre: r.genre ?? null,
        releasedate: r.releasedate ?? null,
        listens: typeof r.listens === "number" ? r.listens : 0,
      };
    } catch (err) {
      console.error("incrementTrackListens error:", err);
      throw new Error("Failed to increment listens");
    }
  },
};

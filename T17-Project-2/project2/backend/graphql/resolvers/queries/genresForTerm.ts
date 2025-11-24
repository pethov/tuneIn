import pool from "../../../src/db";

// Same idea as artistsForTerm but for genres. Useful for dependent dropdowns in SongSearch.
export const Query = {
  async genresForTerm(
    _: unknown,
    {
      term,
      limit,
      artists,
    }: { term: string; limit?: number | null; artists?: string[] },
  ) {
    const t = (term ?? "").trim();

    const params: any[] = [];
    const where: string[] = [];

    if (artists && artists.length) {
      const artistPatterns = artists.map((a) => `%${String(a).trim()}%`);
      params.push(artistPatterns);
      where.push(`artistname ILIKE ANY($${params.length}::text[])`);
    }

    if (t.length >= 1) {
      params.push(`%${t}%`);
      // Include collectionname so album-title searches (e.g. "21") also
      // surface genres for tracks that are part of that album.
      where.push(
        `(trackname ILIKE $${params.length} OR artistname ILIKE $${params.length} OR collectionname ILIKE $${params.length})`,
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    let q = `
      SELECT DISTINCT genre
        FROM track
        ${whereSql}
       ORDER BY genre ASC
    `;
    if (typeof limit === "number" && limit > 0) {
      params.push(limit);
      q += ` LIMIT $${params.length}`;
    }

    const { rows } = await pool.query(q, params);
    const vals = new Set<string>();
    for (const r of rows) {
      const g = r && r.genre ? String(r.genre).trim() : "";
      if (g) vals.add(g);
    }
    const arr = Array.from(vals).sort((a, b) => a.localeCompare(b));
    if (typeof limit === "number" && limit > 0) return arr.slice(0, limit);
    return arr;
  },
};

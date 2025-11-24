import pool from "../../../src/db";

// Returns distinct artist names matching a search term/genre combination. Used by the filter dropdown.
export const Query = {
  async artistsForTerm(
    _: unknown,
    {
      term,
      limit,
      genres,
    }: { term: string; limit?: number | null; genres?: string[] },
  ) {
    const t = (term ?? "").trim();
    const params: any[] = [];
    const where: string[] = [];

    if (Array.isArray(genres) && genres.length > 0) {
      params.push(genres);
      where.push(`genre = ANY($${params.length}::text[])`);
    }

    if (t.length >= 1) {
      params.push(`%${t}%`);
      where.push(
        `(trackname ILIKE $${params.length} OR artistname ILIKE $${params.length} OR collectionname ILIKE $${params.length})`,
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    let q = `SELECT DISTINCT artistname FROM track ${whereSql} ORDER BY artistname ASC`;
    if (typeof limit === "number" && limit > 0) {
      params.push(limit);
      q += ` LIMIT $${params.length}`;
    }

    const { rows } = await pool.query(q, params);

    const set = new Set<string>();
    for (const r of rows) {
      const full = r?.artistname ? String(r.artistname) : "";
      if (!full) continue;
      const parts = full.split(/\s*(?:,|&| and )\s*/i);
      for (let p of parts) {
        p = p.trim();
        if (p) set.add(p);
      }
    }
    const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
    if (typeof limit === "number" && limit > 0) return arr.slice(0, limit);
    return arr;
  },
};

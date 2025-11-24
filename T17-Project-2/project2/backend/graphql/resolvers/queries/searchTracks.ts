import pool from "../../../src/db";

// Core SongSearch resolver: handles term filtering, artists/genres, and multiple sort orders.
export const Query = {
  async searchTracks(
    _: unknown,
    {
      term,
      artists,
      genres,
      limit = 25,
      offset = 0,
      sortDirection = "ASC",
      sortBy = "TRACKNAME",
      filterBy = "ANY",
    }: {
      term: string;
      artists?: string[];
      genres?: string[];
      limit?: number;
      offset?: number;
      sortDirection?: "ASC" | "DESC";
      sortBy?: "TRACKNAME" | "RELEASEDATE" | "MOSTPOPULAR";
      filterBy?: "ANY" | "ARTIST" | "TITLE";
    },
  ) {
    const hasArtists = Array.isArray(artists) && artists.length > 0;
    const hasGenres = Array.isArray(genres) && genres.length > 0;
    const t = (term ?? "").trim();
    const hasTerm = t.length >= 2;

    if (!hasTerm && !hasArtists && !hasGenres) {
      return { total: 0, items: [] };
    }

    const whereParts: string[] = [];
    const params: any[] = [];

    if (hasTerm) {
      const tokens = t.split(/\s+/).filter(Boolean);
      for (const tok of tokens) {
        const pattern = `%${tok}%`;
        params.push(pattern);
        const idx = params.length;
        if (filterBy === "ARTIST") {
          whereParts.push(`artistname ILIKE $${idx}`);
        } else if (filterBy === "TITLE") {
          whereParts.push(`trackname ILIKE $${idx}`);
        } else {
          whereParts.push(
            `(trackname ILIKE $${idx} OR artistname ILIKE $${idx} OR collectionname ILIKE $${idx})`,
          );
        }
      }
    }

    if (hasArtists) {
      const artistPatterns = (artists as string[]).map(
        (a) => `%${String(a).trim()}%`,
      );
      params.push(artistPatterns);
      whereParts.push(`artistname ILIKE ANY($${params.length}::text[])`);
    }

    if (hasGenres) {
      params.push(genres);
      whereParts.push(`genre = ANY($${params.length}::text[])`);
    }

    const whereClause = whereParts.length ? whereParts.join(" AND ") : "FALSE";

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM track WHERE ${whereClause}`,
      params,
    );
    const total: number = totalRows[0]?.cnt ?? 0;

    const direction = sortDirection?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    let selectList = `trackid, trackname, artistname, collectionname, artworkurl100, previewurl, genre, releasedate`;

    const letterFirst = `(CASE WHEN trackname ~ '^[[:alpha:]]' THEN 0 ELSE 1 END)`;

    let orderClause = `ORDER BY ${letterFirst} ASC, lower(trackname) ${direction}, trackid ${direction}`;

    if (sortBy === "RELEASEDATE") {
      orderClause = `ORDER BY releasedate ${direction}, ${letterFirst} ASC, lower(trackname) ${direction}, trackid ${direction}`;
    } else if (sortBy === "MOSTPOPULAR") {
      selectList += `, listens`;
      orderClause =
        direction === "DESC"
          ? `ORDER BY listens DESC NULLS LAST, ${letterFirst} ASC, lower(trackname) ASC`
          : `ORDER BY listens ASC NULLS FIRST, ${letterFirst} ASC, lower(trackname) ASC`;
    }

    params.push(limit);
    params.push(offset);

    const q = `SELECT ${selectList}
           FROM track
          WHERE ${whereClause}
          ${orderClause}
          LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await pool.query(q, params);

    return {
      total,
      items: rows.map((r: any) => ({
        trackId: String(r.trackid),
        trackName: r.trackname,
        artistName: r.artistname,
        collectionName: r.collectionname ?? null,
        artworkUrl100: r.artworkurl100 ?? null,
        previewUrl: r.previewurl ?? null,
        genre: r.genre ?? null,
        releasedate: r.releasedate ?? null,
        listens: typeof r.listens === "number" ? r.listens : 0,
      })),
    };
  },
};

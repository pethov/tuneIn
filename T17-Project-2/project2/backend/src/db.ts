import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

type Track = {
  trackid: string;
  trackname: string;
  artistname: string;
  collectionname?: string | null;
  artworkurl100?: string | null;
  previewurl?: string | null;
  genre?: string | null;
  releasedate?: string | null;
  listens?: number;
};

type PlaylistRow = {
  playlist_id: string;
  playlist_name: string;
  user_id: string;
  plays_count: number;
};

type PlaylistTrackRow = {
  playlist_id: string;
  trackid: string;
  position: number;
  added_at: string;
};

type QueryResultRow = Record<string, unknown>;

type MockQueryResult = {
  rows: QueryResultRow[];
  rowCount?: number;
};

type MockPool = {
  query(
    text: string,
    params?: ReadonlyArray<unknown>,
  ): Promise<MockQueryResult>;
};

let exportedPool: Pool | MockPool | null = null;
let initialized = false;

const toStringOr = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toNumberOr = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

function initMockPool() {
  let playlistCounter = 1;
  const playlists: PlaylistRow[] = [];

  const playlist_tracks: PlaylistTrackRow[] = [];
  const tracks: Track[] = [
    {
      trackid: "t-1",
      trackname: "Top One",
      artistname: "Artist A",
      listens: 10,
    },
    { trackid: "t-2", trackname: "Second", artistname: "Artist B", listens: 5 },
  ];

  const nowIso = () => new Date().toISOString();
  const lower = (value?: string | null) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  const removePlaylistWithTracks = (
    predicate: (pl: (typeof playlists)[number]) => boolean,
  ) => {
    const removed: Array<(typeof playlists)[number]> = [];
    for (let i = playlists.length - 1; i >= 0; i--) {
      if (predicate(playlists[i]!)) {
        removed.push(playlists[i]!);
        playlists.splice(i, 1);
      }
    }

    if (removed.length > 0) {
      for (let i = playlist_tracks.length - 1; i >= 0; i--) {
        if (
          removed.some(
            (pl) => pl.playlist_id === playlist_tracks[i]!.playlist_id,
          )
        ) {
          playlist_tracks.splice(i, 1);
        }
      }
    }
    return removed.length;
  };

  const mockPool: MockPool = {
    async query(text: string, params: ReadonlyArray<unknown> = []) {
      const raw = text || "";
      const q = raw.toLowerCase();
      const trimmed = q.trim();
      const normalized = q.replace(/\s+/g, " ");
      const hasWhere = /\bwhere\b/.test(q);

      // Transaction control
      if (
        trimmed === "begin" ||
        trimmed === "commit" ||
        trimmed === "rollback"
      ) {
        return { rows: [], rowCount: 0 };
      }

      if (q.includes("delete from playlists") && q.includes("and user_id")) {
        const id = params?.[0] as string | undefined;
        const user = params?.[1] as string | undefined;
        const idx = playlists.findIndex(
          (pl) => pl.playlist_id === id && pl.user_id === user,
        );
        if (idx >= 0) {
          playlists.splice(idx, 1);
          for (let i = playlist_tracks.length - 1; i >= 0; i--) {
            const p = playlist_tracks[i];
            if (p && p.playlist_id === id) playlist_tracks.splice(i, 1);
          }
          return { rows: [], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      if (
        q.includes("delete from playlists") &&
        q.includes("where playlist_id = $1") &&
        !q.includes("and user_id")
      ) {
        const id = params?.[0] as string | undefined;
        if (!id) return { rows: [], rowCount: 0 };
        const before = playlists.length;
        for (let i = playlists.length - 1; i >= 0; i--) {
          if (playlists[i]?.playlist_id === id) playlists.splice(i, 1);
        }
        for (let i = playlist_tracks.length - 1; i >= 0; i--) {
          if (playlist_tracks[i]?.playlist_id === id)
            playlist_tracks.splice(i, 1);
        }
        return { rows: [], rowCount: before - playlists.length };
      }

      if (q.includes("delete from playlists") && !q.includes("where")) {
        const removed = playlists.length;
        playlists.length = 0;
        playlist_tracks.length = 0;
        return { rows: [], rowCount: removed };
      }

      // INSERT playlist
      if (normalized.includes("insert into playlists")) {
        const user_id = toStringOr(params?.[0]);
        const playlist_name = toStringOr(params?.[1]);
        const plays_count = toNumberOr(params?.[2], 0);
        const id = `pl-${playlistCounter++}`;
        const row: PlaylistRow = {
          playlist_id: id,
          playlist_name,
          user_id,
          plays_count,
        };
        playlists.push(row);
        return { rows: [row] };
      }

      // SELECT 1 FROM playlists WHERE playlist_id = $1 AND user_id = $2
      if (
        normalized.includes("select 1 from playlists where playlist_id") &&
        normalized.includes("and user_id")
      ) {
        const id = toStringOr(params?.[0]);
        const user = toStringOr(params?.[1]);
        const found = playlists.some(
          (pl) => pl.playlist_id === id && pl.user_id === user,
        );
        return { rows: found ? [{ exists: 1 }] : [] };
      }

      // DELETE playlist
      if (trimmed.startsWith("delete from playlists")) {
        if (!hasWhere) {
          const removed = playlists.length;
          playlists.length = 0;
          playlist_tracks.length = 0;
          playlistCounter = 1;
          return { rows: [], rowCount: removed };
        }

        if (
          normalized.includes("where playlist_id = $1") &&
          normalized.includes("and user_id = $2")
        ) {
          const id = toStringOr(params?.[0]);
          const user = toStringOr(params?.[1]);
          const count = removePlaylistWithTracks(
            (pl) => pl.playlist_id === id && pl.user_id === user,
          );
          return { rows: [], rowCount: count };
        }

        if (normalized.includes("where playlist_id = $1")) {
          const id = toStringOr(params?.[0]);
          const count = removePlaylistWithTracks((pl) => pl.playlist_id === id);
          return { rows: [], rowCount: count };
        }

        return { rows: [], rowCount: 0 };
      }

      // SELECT duplicate playlist detection
      if (
        normalized.includes("from playlists") &&
        normalized.includes("where user_id = $1") &&
        normalized.includes("lower(playlist_name) = lower($2)")
      ) {
        const user = toStringOr(params?.[0]);
        const name = lower(
          typeof params?.[1] === "string" ? (params?.[1] as string) : null,
        );
        const rows = playlists.filter(
          (p) => p.user_id === user && lower(p.playlist_name) === name,
        );
        return { rows };
      }

      // SELECT playlists for user
      if (
        normalized.includes("from playlists") &&
        normalized.includes("where user_id = $1") &&
        !normalized.includes("lower(playlist_name)")
      ) {
        const user = toStringOr(params?.[0]);
        const rows = playlists
          .filter((p) => p.user_id === user)
          .sort((a, b) => a.playlist_name.localeCompare(b.playlist_name));
        return { rows };
      }

      // SELECT playlist by id scoped to user
      if (
        normalized.includes("from playlists") &&
        normalized.includes("where playlist_id = $1") &&
        normalized.includes("and user_id = $2")
      ) {
        const id = toStringOr(params?.[0]);
        const user = toStringOr(params?.[1]);
        const p = playlists.find(
          (pl) => pl.playlist_id === id && pl.user_id === user,
        );
        return { rows: p ? [p] : [] };
      }

      // SELECT playlist by id
      if (
        normalized.includes("from playlists") &&
        normalized.includes("where playlist_id = $1")
      ) {
        const id = toStringOr(params?.[0]);
        const p = playlists.find((pl) => pl.playlist_id === id);
        return { rows: p ? [p] : [] };
      }

      // playlist_tracks helpers
      if (normalized.includes("coalesce(max(position)")) {
        const pid = toStringOr(params?.[0]);
        const max = playlist_tracks
          .filter((pt) => pt.playlist_id === pid)
          .reduce((m, r) => Math.max(m, r.position), 0);
        return { rows: [{ next_pos: max + 1 }] };
      }

      if (
        normalized.includes("update playlist_tracks") &&
        normalized.includes("set position = position + 1")
      ) {
        const pid = toStringOr(params?.[0]);
        const pos = toNumberOr(params?.[1], 0);
        playlist_tracks.forEach((pt) => {
          if (pt.playlist_id === pid && pt.position >= pos) pt.position += 1;
        });
        return { rows: [], rowCount: 0 };
      }

      if (
        normalized.includes("update playlist_tracks") &&
        normalized.includes("set position = position - 1")
      ) {
        const pid = toStringOr(params?.[0]);
        const pos = toNumberOr(params?.[1], 0);
        playlist_tracks.forEach((pt) => {
          if (pt.playlist_id === pid && pt.position > pos) pt.position -= 1;
        });
        return { rows: [], rowCount: 0 };
      }

      if (normalized.includes("insert into playlist_tracks")) {
        const pid = toStringOr(params?.[0]);
        const trackid = toStringOr(params?.[1]);
        const pos = toNumberOr(params?.[2], playlist_tracks.length + 1);
        if (!pid || !trackid) return { rows: [], rowCount: 0 };
        const existing = playlist_tracks.find(
          (pt) => pt.playlist_id === pid && pt.trackid === trackid,
        );
        if (existing) {
          existing.position = pos;
        } else {
          playlist_tracks.push({
            playlist_id: pid,
            trackid,
            position: pos,
            added_at: nowIso(),
          });
        }
        return { rows: [] };
      }

      if (
        normalized.includes("select position") &&
        normalized.includes(
          "from playlist_tracks where playlist_id = $1 and trackid = $2",
        )
      ) {
        const pid = params?.[0];
        const tid = params?.[1];
        const pt = playlist_tracks.find(
          (r) => r.playlist_id === pid && r.trackid === tid,
        );
        return { rows: pt ? [{ position: pt.position }] : [] };
      }

      if (trimmed.startsWith("delete from playlist_tracks")) {
        if (!hasWhere) {
          const removed = playlist_tracks.length;
          playlist_tracks.length = 0;
          return { rows: [], rowCount: removed };
        }

        if (
          normalized.includes("where playlist_id = $1") &&
          normalized.includes("trackid = $2")
        ) {
          const pid = toStringOr(params?.[0]);
          const tid = toStringOr(params?.[1]);
          const idx = playlist_tracks.findIndex(
            (r) => r.playlist_id === pid && r.trackid === tid,
          );
          if (idx >= 0 && playlist_tracks[idx]) {
            const pos = playlist_tracks[idx].position;
            playlist_tracks.splice(idx, 1);
            playlist_tracks.forEach((pt) => {
              if (pt.playlist_id === pid && pt.position > pos) pt.position -= 1;
            });
            return { rows: [], rowCount: 1 };
          }
          return { rows: [], rowCount: 0 };
        }
      }

      // SELECT topTracks
      if (
        normalized.includes("order by listens desc") &&
        normalized.includes("from track")
      ) {
        const limit = Math.max(0, toNumberOr(params?.[0], 10));
        const sorted = [...tracks].sort(
          (a, b) => (b.listens || 0) - (a.listens || 0),
        );
        return { rows: sorted.slice(0, limit) };
      }

      // searchTracks: simple implementation
      if (normalized.includes("from track") && normalized.includes("where")) {
        // if COUNT(*) query
        if (normalized.includes("count(*)")) {
          return { rows: [{ cnt: tracks.length }] };
        }
        // otherwise return items limited
        // very naive filter: match term param against trackname or artistname
        const termParam = params?.[0];
        const term = typeof termParam === "string" ? termParam : undefined;
        let items = tracks;
        if (typeof term === "string" && term.trim()) {
          const t = term.toLowerCase();
          items = tracks.filter(
            (tr) =>
              (tr.trackname || "").toLowerCase().includes(t) ||
              (tr.artistname || "").toLowerCase().includes(t),
          );
        }
        const limit = Math.max(0, toNumberOr(params?.[3], 25));
        return { rows: items.slice(0, limit) };
      }

      // increment listens
      if (
        normalized.includes("update track") &&
        normalized.includes("set listens") &&
        normalized.includes("where trackid = $1")
      ) {
        const id = toStringOr(params?.[0]);
        const t = tracks.find((tr) => tr.trackid === id);
        if (!t) return { rows: [] };
        t.listens = (t.listens || 0) + 1;
        return {
          rows: [
            {
              trackid: t.trackid,
              trackname: t.trackname,
              artistname: t.artistname,
              collectionname: t.collectionname ?? null,
              artworkurl100: t.artworkurl100 ?? null,
              previewurl: t.previewurl ?? null,
              genre: t.genre ?? null,
              releasedate: t.releasedate ?? null,
              listens: t.listens,
            },
          ],
        };
      }

      // SELECT playlist_tracks join track for playlist -> used by Playlist.tracks
      if (
        normalized.includes("from playlist_tracks pt") &&
        normalized.includes("join track t on t.trackid = pt.trackid")
      ) {
        const pid = toStringOr(params?.[0]);
        const rows = playlist_tracks
          .filter((pt) => pt.playlist_id === pid)
          .sort((a, b) => a.position - b.position)
          .map((pt) => {
            const tr = tracks.find((x) => x.trackid === pt.trackid);
            return {
              position: pt.position,
              added_at: pt.added_at,
              trackid: tr?.trackid ?? null,
              trackname: tr?.trackname ?? null,
              artistname: tr?.artistname ?? null,
              collectionname: tr?.collectionname ?? null,
              artworkurl100: tr?.artworkurl100 ?? null,
              previewurl: tr?.previewurl ?? null,
              genre: tr?.genre ?? null,
              releasedate: tr?.releasedate ?? null,
            };
          });
        return { rows };
      }

      // count playlist tracks
      if (
        normalized.includes("select count(*)::int as count") &&
        normalized.includes("from playlist_tracks")
      ) {
        const pid = toStringOr(params?.[0]);
        const count = playlist_tracks.filter(
          (pt) => pt.playlist_id === pid,
        ).length;
        return { rows: [{ count }] };
      }

      // default: return empty rows to avoid throwing
      return { rows: [] };
    },
  };

  // Use the mock pool in the test environment
  exportedPool = mockPool;
  initialized = true;
}

function initRealPool() {
  const pool = new Pool({
    host: process.env.PGHOST ?? "it2810-17.idi.ntnu.no",
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 10, // pool size
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  });

  exportedPool = pool;
  initialized = true;
}

if (!initialized) {
  if (process.env.NODE_ENV === "test") {
    initMockPool();
  } else {
    initRealPool();
  }
}

if (!exportedPool) {
  throw new Error("Failed to initialize database pool");
}

export default exportedPool;

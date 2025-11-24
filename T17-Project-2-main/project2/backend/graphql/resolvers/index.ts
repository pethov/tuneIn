import DateTime from "./scalars/DateTime";
import * as QuerySearch from "./queries/searchTracks";
import * as QueryPlaylists from "./queries/playlists";
import * as QueryPlaylist from "./queries/playlist";
import * as QueryArtists from "./queries/artistsForTerm";
import * as QueryGenres from "./queries/genresForTerm";
import * as QueryTopTracks from "./queries/topTracks";

import Playlist from "./types/Playlist";

import * as MutPlaylist from "./mutations/playlists";
import * as MutPlaylistTracks from "./mutations/playlistTracks";
import * as MutTracks from "./mutations/tracks";

// Glue module: stitches all query resolvers together so the GraphQL server can import a single object.
const Query = {
  _ping: () => "pong",
  ...QuerySearch.Query,
  ...QueryPlaylists.Query,
  ...QueryPlaylist.Query,
  ...QueryArtists.Query,
  ...QueryGenres.Query,
  ...QueryTopTracks.Query,
};

// Same idea for mutations – aggregate every domain-specific resolver here.
const Mutation = {
  ...MutPlaylist.Mutation,
  ...MutPlaylistTracks.Mutation,
  ...MutTracks.Mutation,
};

export default {
  DateTime,
  Query,
  Mutation,
  Playlist,
};

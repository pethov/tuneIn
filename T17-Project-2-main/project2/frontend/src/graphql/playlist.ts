import { gql } from '@apollo/client'

export const Q_PLAYLISTS = gql`
  query GetPlaylists {
    playlists {
      playlistId
      playlistName
      trackCount
      tracks {
        track {
          trackId
          artworkUrl100
        }
      }
    }
  }
`

export const Q_PLAYLIST = gql`
  query GetPlaylist($id: ID!) {
    playlist(id: $id) {
      playlistId
      playlistName
      trackCount
      tracks {
        position
        addedAt
        track {
          trackId
          trackName
          artistName
          collectionName
          artworkUrl100
          previewUrl
          genre
          releasedate
        }
      }
    }
  }
`

export const M_CREATE = gql`
  mutation CreatePlaylist($name: String!) {
    createPlaylist(name: $name) {
      playlistId
      playlistName
    }
  }
`

export const M_DELETE = gql`
  mutation DeletePlaylist($id: ID!) {
    deletePlaylist(id: $id)
  }
`

export const M_ADD = gql`
  mutation AddTrackToPlaylist($input: AddTrackToPlaylistInput!) {
    addTrackToPlaylist(input: $input) {
      playlistId
      playlistName
    }
  }
`

export const M_REMOVE_TRACK = gql`
  mutation RemoveTrack($playlistId: ID!, $trackId: ID!) {
    removeTrackFromPlaylist(playlistId: $playlistId, trackId: $trackId) {
      playlistId
    }
  }
`

export const M_MOVE = gql`
  mutation MoveTrackInPlaylist($playlistId: ID!, $trackId: ID!, $toPosition: Int!) {
    moveTrackInPlaylist(playlistId: $playlistId, trackId: $trackId, toPosition: $toPosition)
  }
`

export const M_INC_PLAYS = gql`
  mutation IncPlays($playlistId: ID!) {
    incrementPlaylistPlays(playlistId: $playlistId)
  }
`

export const Q_SEARCH_TRACKS = gql`
  query SearchTracks(
    $term: String!
    $artists: [String!]
    $genres: [String!]
    $limit: Int
    $offset: Int
    $sortDirection: SortDirection
    $sortBy: SortBy
    $filterBy: TrackFieldFilter
  ) {
    searchTracks(
      term: $term
      artists: $artists
      genres: $genres
      limit: $limit
      offset: $offset
      sortDirection: $sortDirection
      sortBy: $sortBy
      filterBy: $filterBy
    ) {
      total
      items {
        trackId
        trackName
        artistName
        collectionName
        artworkUrl100
        previewUrl
        genre
        releasedate
      }
    }
  }
`

export const Q_ARTISTS_FOR_TERM = gql`
  query ArtistsForTerm($term: String!, $genres: [String!]) {
    artistsForTerm(term: $term, genres: $genres)
  }
`

export const Q_GENRES_FOR_TERM = gql`
  query GenresForTerm($term: String!, $artists: [String!]) {
    genresForTerm(term: $term, artists: $artists)
  }
`

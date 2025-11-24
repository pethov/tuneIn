import { gql } from '@apollo/client'

export const SEARCH = gql`
  query Search($term: String!, $limit: Int, $offset: Int) {
    searchTracks(term: $term, limit: $limit, offset: $offset) {
      total
      items {
        id
        name
        artist
        album
        artworkUrl
        previewUrl
        genre
        releasedate
      }
    }
  }
`

export type TrackId = string | number

export type Track = {
  trackId: TrackId
  /** Some APIs also expose an `id` field – keep it for compatibility. */
  id?: TrackId | null
  trackName: string
  artistName: string
  collectionName?: string
  artworkUrl100?: string
  previewUrl?: string
  genre?: string
  releasedate?: string
  listens?: number
}

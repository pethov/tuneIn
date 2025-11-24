import '../../styles/songSearch/SortMenu.css'

type Props = {
  sortBy: 'TRACKNAME' | 'RELEASEDATE' | 'MOSTPOPULAR'
  sortDirection: 'ASC' | 'DESC'
  onChange: (nextBy: 'TRACKNAME' | 'RELEASEDATE' | 'MOSTPOPULAR', nextDir: 'ASC' | 'DESC') => void
  enabled?: boolean
}

// Presentational select box so SongSearch can show/hide sorting logic without duplicating markup.
export default function SortMenu({ sortBy, sortDirection, onChange, enabled = true }: Props) {
  const value = `${sortBy}_${sortDirection}` as const

  return (
    <section className={`sort-menu ${enabled ? '' : 'is-disabled'}`}>
      <label htmlFor="sortSelect" className="filter-by-label">
        Sort
      </label>
      <section
        className={`select-wrap ${enabled ? '' : 'disabled'}`}
        title={enabled ? undefined : 'Search or choose a genre to enable sorting'}
      >
        <select
          id="sortSelect"
          className="select__control custom-select small sort-select"
          value={value}
          onChange={(e) => {
            if (!enabled) return
            const [by, dir] = e.target.value.split('_') as [
              'TRACKNAME' | 'RELEASEDATE' | 'MOSTPOPULAR',
              'ASC' | 'DESC',
            ]
            onChange(by, dir)
          }}
          aria-label="Sort results"
          aria-disabled={!enabled}
          disabled={!enabled}
        >
          <option value="MOSTPOPULAR_DESC">Most popular</option>
          <option value="TRACKNAME_ASC">A → Z</option>
          <option value="TRACKNAME_DESC">Z → A</option>
          <option value="RELEASEDATE_ASC">Oldest first</option>
          <option value="RELEASEDATE_DESC">Newest first</option>
        </select>
      </section>
    </section>
  )
}

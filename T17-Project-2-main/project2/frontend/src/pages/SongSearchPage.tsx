// Dedicated SongSearch route (mobile only) so we can reuse <SongSearch /> without the home layout.
import SongSearch from '../components/songSearch/SongSearch'
import '../styles/songSearch/songSearchPage.css'

export default function Search() {
  return (
    <main className="search-page">
      <section className="home-search2">
        <SongSearch />
      </section>
    </main>
  )
}

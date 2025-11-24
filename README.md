# IT2810 Project 2 - TuneIn

We have developed an application that fetches and displays songs from our own database. The database was initially populated using a script that imported song data from the iTunes Search API. Users can browse through the songs, search for new music, and add tracks to their personal playlists.

**You can try out the website** [HERE](http://it2810-17.idi.ntnu.no/project2/)

> **Important:** The project is hosted on the NTNU VM.  
> To access the website or run the backend locally, you **must be connected to NTNU’s network**.  
> This means either:
> - Using **eduroam** on campus, or
> - Using **VPN** (GlobalProtect or Cisco AnyConnect) when off-campus.
---

#### Contents
- [Features](#features)
- [Application showcase](#application-showcase)
- [Getting started/Running the project](#getting-started)
- [Running tests](#running-tests)
- [Linting and formatting](#linting--formatting)
- [Choices made along the way](#choices-made-along-the-way)
- [Documentation of AI usage](#documentation-of-ai-usage)
- [Reviews](#reviews)
- [Group members](#group-members)

## Features
- **Top Tracks:** Highlights the most played songs in our database and is shown on the home page. This helps users discover new and popular music.

- **Search**: Search for songs and view results fetched from our database, which is populated using the iTunes Search API. The database currently contains over 11,000 songs. While not every song will be available, there is always something new to enjoy!

- **Sort**: Sort search results alphabetically ("A–Z" / "Z–A"), by popularity, or by release date ("newest first" / "oldest first"). Sorting can be applied after a search is made. 

- **Filter**: Filter search results by artist, genre, or a combination of both. Filters that would yield zero results are prevented to ensure a smooth user experience. 

- **Now playing footer**: Play a chosen track while continuing to browse the app. Use keyboard controls (arrow keys to navigate, space to play/pause) and drag the progress bar to seek within the track. When running the application on a mobile phone, music keeps playing after locking the phone, allowing the user to control the playing from lock screen.
Due to licensing limits, only a preview clip is available.
Playback progress and last played track are saved locally, so the user can continue where they left off.

- **Navigation:** Move between tracks using previous/next controls, or jump directly to a specific track from search results or playlists.

- **Playlist**: Create personal playlists, and add or remove songs at any time. Playlists can also be deleted. 
The four most recently played playlists are directly available from a shortcut on the home page, while the rest can be found under the playlists page. On the playlist page, sort the view of playlists either alphabethically ("Alphabethical") or by most recently interacted with first ("Recent"). Search for a specific playlist on the Playlists page. 

- **Shuffle:** Shuffle playback can be toggled on or off in both playlists and the Now Playing footer. When enabled, the order of tracks is randomized based on the current context (playlist, search results, or Top Tracks). 

- **Replay (available for playlists and Top Tracks):** Toggle replay mode once in the Now Playing footer to repeat the entire list, or twice to repeat the current track. Replay is intentionally disabled for search results.

- **Recently Played:** The four most recently played playlists are displayed on the home page for quick access.

## Application showcase

Application showcase can be found [here!](./project2/docs/SHOWCASE.md)

---

## Getting started

Clone the repository:
```bash
git clone https://git.ntnu.no/IT2810-H25/T17-Project-2
```

### Running the project

In order to run the project locally, one has to first create two .env files, one in the frontend-module and one in the backend-module. 

**Backend .env:**

First create the .env-file from the terminal:

```bash
cd T17-Project-2
cd project2
touch backend/.env
```
Then open it and add the variables listed above.

```bash
# Postgres
DB_HOST=it2810-17.idi.ntnu.no:5432
DB_PORT=5432
DB_NAME=project2_db
DB_USER=project2
DB_PASSWORD=webgirlies

DATABASE_URL=postgresql://appuser:webgirlies@it2810-17.idi.ntnu.no:5432/project2_db

# Server
PORT=3001
NODE_ENV=production
```
**Frontend .env:**

First create the .env-file from the terminal:

```bash
cd T17-Project-2
cd project2
touch frontend/.env
```
Then open it and add the info listed above.

```bash
#VITE_GRAPHQL_URL=http://it2810-17.idi.ntnu.no:3001/graphql # to run backend on vm
VITE_GRAPHQL_URL=http://localhost:3001/graphql # to run backend locally
```

### To then run the project, open two terminals and follow the description below:

**1. Route to the backend folder and run the development server:** 
```bash
cd T17-Project-2
cd project2
cd backend
npm install
npm run dev
```

**2. Route to the frontend folder and run the development server:**
```bash
cd T17-Project-2
cd project2
cd frontend
npm install
npm run dev
```
## Running tests

Information about running tests can be found [here.](./project2/docs/TESTING.md)

## Linting and formatting

The project uses **ESLint** for linting and **Prettier** for code formatting.

From the `project2/frontend` and `project2/backend` folders you can run:

```bash
npm run lint     # run ESLint
npm run format   # run Prettier 
```

## Choices made along the way
 
Information about our choices made along the way can be found [here.](./project2/docs/CHOICES.md)

## Documentation of AI usage
Artificial Intelligence tools, specifically ChatGPT 5, GitHub Copilot and Claude, have been used during development of the application. They assisted with:
- Setting up the core of the project.
- Debugging errors in React and TypeScript code.
- Generating boilerplate code snippets and improving readability.
- Generating the mocked data for the playlists for the first and second iteration in order to save time.
- Providing suggestions for documentation structure.
- Writing issue descriptions and commit messages that are detailed and consistent throughout the project.

All AI-generated code and text was tested and reviewed using code review in GitHub. The final implementation reflects the team’s own understanding and decisions.

## Reviews
A summary of the feedback we have received from other students through this course can be found [here](./REVIEWS.md). 

We found the feedback on functionality and user interaction especially useful, and used them to improve our website in combination with feedback from teaching assistants, friends and family.

## Group members
- Petra Hoveid (petramh@stud.ntnu.no)
- Emma Molden (emmamold@stud.ntnu.no)
- Runa Stave (runasst@stud.ntnu.no)
- Selma Stein (selmabst@stud.ntnu.no) 
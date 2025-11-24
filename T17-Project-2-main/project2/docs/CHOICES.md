# Choices made along the way

This document explains the choices we have made along the way.

#### Contents
- [API and database choice](#api-and-database-choice)
- [Codebase structure](#codebase-structure)
- [Search, filter and sort](#search-filter-and-sort)
- [Sustainability and performance](#sustainability-and-performance)
- [Testing](#testing)
- [Design, Responsivity and Performance](#design-responsivity-and-performance)
- [Use of local storage for user identification](#use-of-local-storage-for-user-identification)
- [Constraints](#constraints)

---

### API and database choice

In this project, our goal was to build a complete full-stack web application with both frontend and backend, including our own database hosted on a virtual machine. To provide a rich dataset for search and interaction, we initially chose the **iTunes Search API** as our data source. The API is free, easy to use, and provides all the core information we needed about songs, including 30-second audio previews that can be legally streamed in the app. While other APIs such as Spotify or Apple Music offer more features, they are complex to integrate and come with strict authentication requirements, which would slow down development. Using iTunes allowed us to quickly prototype and focus on functionality like search, sorting, and filtering.

However, since one of the course requirements was to set up our **own database and backend**, we used iTunes data only as a **starting point**. We extracted a large dataset from the API and stored it in our own **PostgreSQL** database running on our group’s virtual machine. We initially experimented with MongoDB, but after facing deployment challenges and performance issues, we switched to PostgreSQL for better relational structure and stability. Our final dataset contains over **11,000 songs**, ensuring that our application can handle large result sets dynamically, as required by the assignment.

Today, the application retrieves all song information directly from our local database, which improves performance, ensures data persistence, and makes the system independent from external APIs. This design supports scalability and aligns with the project’s goals of implementing a sustainable, accessible, and production-ready web application.

---

### Codebase structure

Our project is divided into two main parts, **backend** and **frontend**, to maintain a clean separation of concerns and make the system more scalable and maintainable. In addition, we have **docs** folder containing documentation about our project and a showcase of the application. 

The **backend** (Node.js with GraphQL) is responsible for all data handling, including API communication, schema definitions, and data resolvers. We structured it into clear subfolders such as graphql/ (for schema and resolvers), src/ (for main application logic and database handling), and __tests__/ (for backend testing). This modular layout makes it easy to navigate, extend, and test individual parts of the backend without affecting others.

The **frontend** (Vite + React + TypeScript) focuses entirely on user experience and interface logic. Its src/ directory is organized by functionality to encourage reusability and maintain clarity:

    components/ – reusable UI components such as buttons, navigation bars, and playlist cards

    hooks/ – shared React logic for state management and side effects

    graphql/ – frontend GraphQL queries and fragments kept close to where they are used

    lib/ – small utilities and helper functions

    pages/ – route-level components representing different views in the app

    player/ – logic related to the audio player

    styles/ – CSS modules and global styles grouped by feature

This structure allows developers to easily find, update, and test code within a well-defined scope. It also supports collaboration by ensuring that frontend and backend can evolve independently while communicating through a consistent GraphQL API.

---

### Search, filter and sort

When designing our search functionality, we took inspiration from familiar patterns in modern music streaming services such as Spotify and Apple Music. We wanted users to be able to explore music in multiple ways, whether they had a specific song in mind or simply wanted to browse.

We chose to support filtering by **genre** and **artist**. Filtering by genre is available at all times, even before a search is made, as it can be useful for users who want to discover music within a specific category. Filtering by artist, however, only becomes available after a search to avoid overwhelming the user with long artist lists. To ensure a smooth user experience, filter and sort combinations that would produce no results are automatically disabled.

If a search returns no matches, the user receives clear and friendly feedback indicating that no results were found.

To make the interface feel responsive and consistent, search results and sorting preferences are stored using session storage. This means that refreshing the page will keep the current search and sorting state. However, navigating back to the home page through the logo or via the Playlists page intentionally resets the search and filters, providing the user with a clean starting point.

When refreshing on home page, search results are stored in session storage. But when clicking on the logo TuneIn, or go back to home from the Playlists-page, a search is not stored. Filters go away as well, but your chosen sorting is session storage. 

---

### Sustainability and performance

To improve performance and maintainability, we refactored large components into smaller, reusable pieces located under frontend/components. This reduced the overall bundle size and improved rendering speed, resulting in smoother and more responsive interactions.

We also optimized image loading and adopted a dark color palette, which is both visually comfortable and power-efficient on OLED displays.

Performance was evaluated using **Google Lighthouse**.
When running locally in development mode (`npm run dev` in both backend and frontend), the performance score was around 50, as development builds are not optimized.
However, when running on the virtual machine (where the backend is started with `npm ci` and the frontend is built using `npm run build`) the optimized production version achieved a Lighthouse score of 98.
This demonstrates that the application performs efficiently under realistic deployment conditions, significantly outperforming comparable modern music platforms (such as Spotify, which typically scored between 18–30 when we checked using Google Lighthouse).

---

### Testing

We combined *automated testing* and *manual user testing* to ensure quality, robustness, and a good user experience throughout the project.

For the frontend, we use *Vitest* together with *React Testing Library*. Our component and integration tests cover the search flow (input handling and rendering results), filter logic (enabling/disabling filters and keeping artist/genre selections consistent), playlist UI (playlist cards, playlist detail pages, and “play all”), user-generated data flows (creating playlists and adding tracks), as well as the audio player components such as the Now Playing footer and play bar. We also explicitly test several *accessibility aspects* using ARIA roles (searchbox, list, listitem, progressbar, slider, aria-busy) and correct disabled-state behavior.

For the backend, we use *Vitest + Supertest* to spin up the Express/Apollo app against our Postgres pool and cover the full GraphQL playlist workflow. Beyond just verifying GET /health and _ping, the suite now exercises playlist CRUD (create/list/update/delete), ownership/authorization rules (for example user context headers and cross-user access), and error propagation for domain operations such as incrementTrackListens. Each test truncates the relevant tables so we can assert against real inserts/updates and ensure the resolvers and SQL layer behave as expected end-to-end.

For end-to-end testing, we rely on *Playwright*. These browser-based tests simulate real user flows, including:
- searching and adding tracks to an existing playlist  
- searching → creating a new playlist → adding a track → playing it  
- handling empty playlist states and deleting playlists  
- controlling playback via the play bar (next/previous, shuffle, repeat with playlist wrap-around)  
- ensuring that player state and sorting preferences persist across page refreshes  
- edge cases such as short search terms (which should not trigger GraphQL requests), network failures during search, and preventing duplicate additions to playlists.

Most E2E tests use mocked GraphQL responses to keep them deterministic, but we also include a scenario that runs against the *real backend* to validate the full integration.

In addition to automated testing, we performed *continuous manual user testing* (ourselves, friends, family, and teaching assistants). Their feedback led to improvements in search UX, error handling, empty states, accessibility details, and perceived performance when working with larger result sets.

---

### Design, Responsivity and Performance

We put significant effort into the design of our platform, drawing inspiration from modern streaming services such as Spotify. Our goal was to create a familiar and intuitive user experience. Throughout development, we continuously tested the platform with friends, family, and teaching assistants to gather feedback on both visual design and interactivity. This helped us reduce ambiguity in the user interface and improve usability, for example, by adding clear visual feedback like a checkmark when a song is added to a playlist.

We also wanted to challenge ourselves with responsive design and developed a dedicated mobile layout. On mobile, the navigation bar is placed at the bottom for easier access, and the search functionality is moved to its own page to simplify interaction. The “Play Now” bar displays less information in mobile view, but users can tap it to expand details, view the album cover, and navigate between tracks. Other responsive features include rotating long titles on the Play Now bar, and the option to switch viewing orientation (e.g., on iPad).

#### Accessibility
Accessibility was equally important to us. We aimed to make the platform usable for a broad audience and followed WCAG accessibility guidelines as closely as possible, continuously checking accessibility manually and with Google Lighthouse. Some concrete measures include maintaining high color contrast, ensuring layouts handle text zoom properly, adding ARIA labels, using semantic HTML, and supporting keyboard navigation throughout the site (full tab-through functionality). We also aimed to make interactive areas large and easy to reach to support users with motor impairments.

Accessibility for users with hearing impairments is naturally more challenging to address in a music-focused app, but we have been mindful of this limitation in our design choices.

---

### Use of local storage for user identification

We decided to generate and store a unique user ID in local storage instead of implementing a traditional account system with database-backed authentication. This approach was chosen primarily to provide a smoother and more accessible user experience, allowing users to test the application immediately without needing to register or log in. Since the course involves frequent peer evaluations and demonstrations, minimizing friction was important to ensure that anyone could access and experiment with the app seamlessly.

We are aware that this choice comes with trade-offs. By relying on a client-side ID, we intentionally accept limitations such as the inability to synchronize a user’s playlists across multiple devices. There are also inherent security considerations with storing identifiers in local storage, as they are less protected than server-side credentials. However, given the scope of this project, we prioritized simplicity, usability, and development focus over full authentication infrastructure. The local-storage approach still enables personalized functionality, such as private playlists associated with each user, while keeping the system lightweight and aligned with the assignment’s requirements.

---

### Constraints

During development and user testing, we have discovered some constraints:

- Playlists cannot be renamed after creation
- Only 30-second song previews are available due to copyright restrictions, which could not be worked around within the scope of this project.

Our main focus for this project was placed on implementing robust search, filtering, and sorting functionality, improving accessibility, and refactoring large components to ensure better sustainability, performance, and maintainability of the codebase.


# Running tests

This document describes how to run the API unit tests and end-to-end (E2E) tests locally.

You can read more about our choices related to testing [here.](./CHOICES.md)

## Prerequisites
- Node.js (>=18.0.0) and npm (>=9.0.0) installed (the tests for the project was developed on macOS/zsh).
- For E2E tests the Playwright package will download browser binaries (first run will download ~100s of MB).
- The backend uses PostgreSQL; for full integration you should have DB credentials available in `.env` in `project2/backend`.
- The required environment variables for the backend `.env` file are:
```bash
VITE_GRAPHQL_URL=http://localhost:3001/graphql
```

## Backend (API) tests

1. Install dependencies and run backend tests:

```bash
cd project2/backend
npm install
npm test
```

Notes:
- The API tests use `vitest` + `supertest` and spin up the Express/Apollo app without listening on the real port.
- To run backend tests in watch mode use `npm test -- --watch` (or your preferred vitest flags).


## Frontend component tests (unit / integration)

Component and unit tests live in `project2/frontend` and use `vitest` (jsdom environment) and Testing Library.

1. Install frontend dependencies and run the component tests:

```bash
cd project2/frontend
npm install
npm test
```

Notes:
- `npm test` runs the Vitest suite which includes component tests in `src/components/__tests__` and other unit tests.
- Use `npm test -- --watch` to run in watch mode.
- These tests run in a jsdom environment and do not require the dev server to be running.

## E2E tests (Playwright)

E2E tests are implemented with Playwright and exercise the app in a real browser. 

1. Start backend dev server in one terminal:

```bash
cd project2/backend
npm install
npm run dev
```

2. Start frontend dev server in another terminal:

```bash
cd project2/frontend
npm install
npx playwright install
npm run dev
```

3. With both dev servers running

```bash
cd project2/frontend
npm run e2e
```

Important: E2E tests require the app to be reachable. Start both `npm run dev` servers manually before running  e2e. If the servers are not running or reachable the tests will fail.


## Manual user testing 
In addition to automated tests, we have performed continuous manual user testing throughout the development process:

- Each group member tested interaction flows weekly
- We tested with 5+ external users (friends/family)
- We observed typical usage patterns and edge cases

Feedback was used to improve:

- Search UX
- Result pagination
- Clarity of error messages
- Accessibility (keyboard navigation, focus management)
- General usability
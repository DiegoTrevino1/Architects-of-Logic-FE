# Architecture

Frontend for **Architects of Logic** — a CWU Computer Architecture learning app with two interactive games (cache mapping and number systems / spell counter), pre/post-assessments, XP scoring, and a class leaderboard.

## Stack

- **React 19** (function components + hooks)
- **Vite 8** (dev server + build, `@vitejs/plugin-react`)
- **Plain CSS** per component (no CSS framework, no preprocessor)
- **ESLint** with `react-hooks` and `react-refresh` plugins
- **No router, no state library** — view switching and data flow are handled directly inside `App.jsx`
- **Backend contract**: REST/JSON over HTTP at `http://localhost:4000/api` with JWT bearer auth (token persisted in `localStorage`)

## Repository layout

```
.
├── index.html              # Vite entry — mounts #root
├── vite.config.js          # Vite + React plugin
├── eslint.config.js
├── package.json
├── public/                 # Static assets served verbatim
└── src/
    ├── main.jsx            # createRoot → <App />
    ├── App.jsx             # View router + session/data shell + HomePage
    ├── App.css             # Global theme tokens + home/nav/hero styles
    ├── index.css           # Body reset
    ├── api.js              # fetch wrapper, token helpers, postProgress
    ├── LoginPage.jsx/.css  # Login + register form
    ├── LibraryCacheGame.jsx/.css   # Cache mapping game
    ├── SpellCounter.jsx/.css       # Number systems combat game
    └── assets/
```

## Application shell

`src/App.jsx` is the entire client-side router and session container. There is no `react-router` — `App` keeps a `view` string in state and renders one of three trees:

| `view`   | Component rendered     | Notes                                         |
| -------- | ---------------------- | --------------------------------------------- |
| `"home"` | `<HomePage />`         | Default. Hero + game cards + progress + LB.   |
| `"auth"` | `<LoginPage />`        | Login/register tabs.                          |
| `"game"` | `<LibraryCacheGame />` or `<SpellCounter />` based on `selectedGameId` (`"cache"` or `"number"`). |

Navigation handlers (`goHome`, `goGame`, `goAuth`) just call `setView` + adjust `selectedGameId`. Each game's `onBack`/`onHome` props point back at `goHome`.

### Why no router?

The app has 3 top-level views and no need for deep links, browser-back semantics, or shareable URLs. A state machine in `App.jsx` is smaller and cheaper than React Router and matches the actual UX (single-page kiosk-style flow).

## Session & auth flow

Auth is JWT-based. `src/api.js` owns all token handling:

- `saveToken / getToken / clearToken / hasToken` — read/write `localStorage["aol_token"]`.
- `apiFetch(path, opts)` — wraps `fetch`, sets `Content-Type: application/json`, attaches `Authorization: Bearer <token>` if present, parses JSON, and throws an `Error` with `.status` on non-2xx.
- `postProgress(payload)` — convenience POST to `/progress`. **No-ops silently if the user is logged out** so games can call it unconditionally.

Session lifecycle in `App.jsx`:

1. **Mount hydration** — `useEffect` on mount: if `hasToken()`, call `GET /auth/me`. On success, populate `user` and set `isLoggedIn=true`. On failure, `clearToken()` (token expired/invalid).
2. **Login/Register** — `LoginPage` POSTs to `/auth/login` or `/auth/register`, calls `saveToken(data.token)`, then invokes `onLoginSuccess(data.user)`. `App` flips to home view.
3. **Logout** — `clearToken()`, reset `user`/`progress`, `setView("home")`.

This means **the server is the source of truth for user identity**. The client only persists the JWT.

## Data fetching pattern

`App.jsx` triggers three fetches via `useEffect`:

- `/auth/me` — once on mount if a token exists.
- `/leaderboard?limit=5` — every time `view === "home"` or `refreshTick` increments.
- `/progress/me` — every time we land on home AND `isLoggedIn` is true.

`refreshTick` is a manual cache-buster: `goHome()` and `handleLoginSuccess()` bump it so returning from a game refetches the leaderboard and personal progress, picking up scores the user just submitted.

There is intentionally no global cache, no SWR/React Query — the data is small, the home screen is the only consumer, and refetching on navigation is fine.

## Games

Both games are self-contained components owning their own phase/round/score state. They:

1. Render their own UI (mode select → play → summary, with optional pre/post-test).
2. Compute final score + accuracy locally.
3. Call `postProgress({ gameId, score, accuracy, xpEarned })` exactly **once** when the round ends. This call is fire-and-forget — failure is logged to `console.warn` and never surfaced to the user.

### Library Cache Game (`LibraryCacheGame.jsx`)

- Three modes: Direct, Set-Associative, Fully Associative (`MODES` array).
- Fixed sample of 6-bit addresses (`SAMPLE_REQUESTS`); user clicks a slot in a 16-slot (4×4) cache grid.
- Correctness rule depends on `mode.id`:
  - `direct` — slot must equal `parseInt(req.index, 2)`.
  - `set` — `Math.floor(slot/4)` must equal the index value.
  - `associative` — slot must be empty.
- Posts progress (`gameId: "cache"`) on the transition into the summary phase.

### Spell Counter (`SpellCounter.jsx`)

- Phases: `select → pretest → battle → posttest → summary`.
- Pre/post-test are 3 multiple-choice questions sharing the same UI block (`testIdx`/`testAns`/`testResults`).
- Battle: enemy casts a hex/binary value; player types a hex counter; bit-by-bit scoring (8 bits, partial credit). Damage = `round(accuracy * 40)`.
- `bitStats` accumulates correct/total bits across rounds; final accuracy = `bitStats.correct / bitStats.total`.
- `progressSent` flag guards against double-posting when the battle ends.

## Backend contract

Consumed but not part of this repo. Endpoints used:

| Method | Path                       | Auth | Body / Query                                  | Response                                                       |
| ------ | -------------------------- | ---- | --------------------------------------------- | -------------------------------------------------------------- |
| POST   | `/auth/register`           | no   | `{ username, password }`                      | `{ token, user }`                                              |
| POST   | `/auth/login`              | no   | `{ username, password }`                      | `{ token, user }`                                              |
| GET    | `/auth/me`                 | yes  | —                                             | `user` object                                                  |
| GET    | `/leaderboard?limit=N`     | no   | —                                             | `[{ rank, username, totalXp }, …]` ordered by rank             |
| GET    | `/progress/me`             | yes  | —                                             | `{ totalXp, perGame: { cache: { bestScore, … }, spell: { … } } }` |
| POST   | `/progress`                | yes  | `{ gameId, score, accuracy, xpEarned }`       | (response not consumed)                                        |

Errors are returned as `{ error: "<message>" }` with a non-2xx status; `apiFetch` raises this as a thrown `Error`.

The base URL is hardcoded to `http://localhost:4000/api` in `src/api.js`. For non-local deploys this constant needs to move to a Vite env var (`import.meta.env.VITE_API_URL`).

## Styling

- One CSS file per component, scoped by class-name prefix (`lcg-*` for cache game, `sc-*` for spell counter, `auth-*` for login).
- Theme tokens (`--accent`, `--text2`, `--mono`, …) are declared in `App.css` and consumed everywhere.
- No CSS modules, no Tailwind, no `styled-components` — class collisions are avoided by prefixes alone.
- A few one-off styles use inline `style={{ … }}` for values derived from props (progress widths, conditional colors).

## Dev & build

```
npm run dev       # Vite dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Serve dist/ locally
npm run lint      # ESLint (flat config in eslint.config.js)
```

The backend at `http://localhost:4000` must be running for auth, progress, and the leaderboard to populate; the home screen still renders without it (the fetch failures are caught and the leaderboard shows an empty-state hint).

## Known limitations / TODOs

- API URL is hardcoded — should become an env var before any non-local deploy.
- No router → no deep-linking into specific games or modes; refresh always lands on home.
- `apiFetch` doesn't auto-redirect to login on 401; `App` only clears the token on initial `/auth/me` failure. A per-call 401 handler would be a small follow-up.
- `LibraryCacheGame` uses a fixed 3-request sample; difficulty/scoring is constant per session.
- Pre/post-test answers are not yet POSTed to the backend — only battle results are persisted via `/progress`.

# Live Polling App

Live Polling App is a full-stack real-time polling platform for creating questions, sharing polls, collecting audience votes, and viewing updated results without refreshing the page. The project uses a React/Vite frontend, a Go/Gin backend, MongoDB persistence, Redis-backed counters and Pub/Sub, JWT authentication, and WebSockets for connected poll viewers.

## Live Demo

[Open the Live Polling App](https://live-polling-app-three.vercel.app/)

## GitHub Repository

[View the source repository](https://github.com/vishnu-priya06/live-polling-app)

## Overview

The core product flow is:

**Create Poll -> Share Poll -> Audience Votes -> Live Results**

Authenticated creators can create and manage polls. Public viewers can open a poll, select an option, vote once per poll browser fingerprint, and watch the result counts update through the real-time channel.

## Key Features

- User signup and login with JWT-based sessions.
- Protected creator dashboard, analytics, poll creation, and poll management routes.
- Poll creation with a question and at least two distinct options.
- Client-side and backend validation for authentication, poll creation, options, and vote requests.
- Public poll viewing, voting, and result viewing.
- Duplicate-vote prevention using a browser voter fingerprint and persisted vote records.
- Poll owner actions to view, close, and delete polls.
- Redis-backed vote counters and Pub/Sub messages for real-time result updates.
- WebSocket connections scoped to individual polls.
- Creator dashboard with poll totals, active and closed poll counts, vote totals, and recent poll performance.
- Analytics view based on real poll and vote data.
- Responsive Live Pulse interface for desktop, tablet, and mobile screens.

## Tech Stack

### Frontend

- **React**: UI components, forms, route views, authentication state, and live result rendering.
- **Vite**: frontend development server, build tooling, and local API/WebSocket proxy.
- **React Router**: client-side navigation and protected routes.

### Backend

- **Go**: backend application and service layer.
- **Gin**: HTTP routing, request binding, middleware, and JSON responses.
- **MongoDB**: persistent storage for users, polls, and votes.
- **Redis**: per-poll vote counters and Pub/Sub transport for result updates.
- **JWT**: signed authentication tokens used by protected API routes.
- **Gorilla WebSocket**: WebSocket connections between the backend and poll clients.
- **bcrypt**: password hashing and password verification.

## How Real-Time Updates Work

Real-time results use both Redis and WebSockets:

1. A vote request reaches the Go/Gin backend.
2. The vote is validated and stored in MongoDB.
3. Redis increments the counter for the selected option in a poll-specific hash named with the poll ID.
4. The backend reads the updated Redis counters and publishes the result payload to the poll-specific Pub/Sub channel `poll:<poll-id>:updates`.
5. The Redis subscriber listens to the `poll:*:updates` pattern.
6. When a message arrives, the subscriber extracts the poll ID and broadcasts the payload through the WebSocket hub to clients connected to that poll.
7. The React poll detail page receives the message and updates its result bars and counts without a page refresh.

Closing a poll also broadcasts a `poll_closed` lifecycle message through the WebSocket hub so connected clients can update their state.

## Architecture

```text
React + Vite frontend
        |
        | HTTP API requests
        v
Go + Gin backend  ------->  MongoDB
        |
        | vote counters and Pub/Sub
        v
      Redis
        |
        | subscribed updates
        v
WebSocket hub  --------->  Connected poll clients
```

The frontend calls the Go API for authentication, poll data, votes, and analytics. The backend persists durable data in MongoDB. Redis handles fast per-poll counters and distributes update messages to the backend subscriber, which broadcasts them to the appropriate WebSocket clients.

## Project Structure

```text
live-polling-app/
├── frontend/
│   ├── src/
│   │   ├── api/              # Shared HTTP client and auth failure handling
│   │   ├── auth/             # Auth context and protected route wrapper
│   │   ├── hooks/            # Creator poll analytics hook
│   │   ├── pages/            # Home, auth, dashboard, poll, results, and analytics views
│   │   ├── App.jsx           # Navigation and application routes
│   │   ├── App.css           # Product UI styles
│   │   └── index.css         # Global design tokens and base styles
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json           # SPA fallback for React Router deep links
├── backend/
│   ├── cmd/
│   │   ├── server/           # Main HTTP/WebSocket server entry point
│   │   └── ws-test/          # WebSocket test client
│   ├── config/               # Environment, MongoDB, and Redis setup
│   ├── controllers/          # HTTP handlers for auth, polls, and votes
│   ├── middleware/           # JWT authorization and CORS middleware
│   ├── models/               # User, poll, and vote data models
│   ├── routes/               # API and WebSocket route registration
│   ├── services/             # Auth, poll, vote, and Redis subscriber services
│   ├── utils/                # Password, JWT, and error-response helpers
│   ├── websocket/             # WebSocket handler and per-poll hub
│   ├── go.mod
│   └── go.sum
├── models/                   # Root-level poll model package present in the repository
└── README.md
```

## Authentication & Security

Authentication uses JWTs signed by the backend with an environment-provided secret:

1. Signup validates the name, email, password, and password length.
2. The password is hashed with bcrypt before the user is stored in MongoDB.
3. Login verifies the submitted password against the stored bcrypt hash.
4. Signup and login return a signed JWT containing the user ID and a 24-hour expiration.
5. The frontend stores the session token and sends it as a Bearer token for protected requests.
6. The backend middleware validates the token before allowing creator poll operations.

The protected operations include creating polls, listing the authenticated creator's polls, closing polls, and deleting polls. Poll ownership is checked before close and delete operations. JWT configuration is validated at backend startup and during token operations; secrets are never part of this documentation.

## Validation

Gin request binding validates required fields, email format, minimum lengths, and required arrays at the controller boundary. The service layer also validates poll IDs, poll state, option ownership, duplicate options, poll ownership, duplicate votes, and whether a poll is still accepting votes. Errors are returned as JSON responses with an `error` field.

## Local Setup

### Prerequisites

- Go 1.27 or a compatible Go toolchain for the backend.
- Node.js and npm for the frontend.
- A reachable MongoDB instance.
- A reachable Redis instance with Pub/Sub support.

### Backend

1. Create `backend/.env` from `backend/.env.example`.
2. Set every required environment variable using your local MongoDB, Redis, JWT, CORS, and port configuration.
3. Start the backend:

```powershell
cd backend
go mod download
go run ./cmd/server
```

The backend listens on the configured `PORT`. When no port is set, the application defaults to port `8080`.

### Frontend

1. Install dependencies:

```powershell
cd frontend
npm install
```

2. For local development, leave `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` unset to use the Vite proxy, or configure them explicitly for another backend.
3. Start the frontend:

```powershell
npm run dev
```

4. Create a production build when needed:

```powershell
npm run build
```

## Environment Variables

Values are intentionally omitted. Configure these names in the appropriate local or deployment environment.

### Backend variables

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection URI. |
| `MONGO_DB_NAME` | MongoDB database name. |
| `REDIS_HOST` | Redis hostname. |
| `REDIS_PORT` | Redis port. |
| `REDIS_USERNAME` | Redis username when required. |
| `REDIS_PASSWORD` | Redis authentication password. |
| `JWT_SECRET` | Secret used to sign and validate JWTs; use a strong value of at least 32 characters. |
| `ALLOWED_ORIGINS` | Comma-separated browser origins accepted by HTTP CORS and WebSocket origin checks. |
| `PORT` | Backend HTTP server port. |

### Frontend variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Optional API origin prepended to frontend API paths in production. |
| `VITE_WS_BASE_URL` | Optional WebSocket origin used for poll live updates in production. |
| `VITE_DEV_API_TARGET` | Optional local Vite proxy target for `/api` requests. |
| `VITE_DEV_WS_TARGET` | Optional local Vite proxy target for `/ws` requests. |

## Deployment

- The frontend is deployed on **Vercel**.
- The backend is deployed on **Render**.
- MongoDB and Redis are external services used by the backend.
- Production frontend: [https://live-polling-app-three.vercel.app/](https://live-polling-app-three.vercel.app/)
- The Vercel deployment uses the frontend SPA rewrite so React Router deep links resolve to `index.html`.
- Production frontend environment configuration should point `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` to the deployed backend's HTTP and secure WebSocket origins.

## Key Design Decisions

- **Frontend/backend separation** keeps the React user experience independent from the Go API and persistence services.
- **MongoDB** stores durable users, polls, and votes.
- **JWT authentication** provides stateless access tokens for protected creator routes.
- **Backend validation** protects the API even when requests do not come from the frontend UI.
- **Redis counters and Pub/Sub** provide fast live vote aggregation and cross-process update delivery.
- **WebSockets** let connected poll clients see result and poll-lifecycle changes without refreshing.
- **Vercel and Render** provide separate deployment targets suited to the frontend and long-running backend service.

## Extra Features

- Creator-focused dashboard and analytics views.
- Poll closing with a broadcast lifecycle update to connected clients.
- Poll deletion also removes the creator's stored vote records for that poll.
- Browser voter fingerprinting to prevent duplicate votes from the same browser for a poll.
- Automatic WebSocket reconnect attempts in the poll detail view.
- Responsive light-first Live Pulse design with accessible focus and reduced-motion considerations.

## Testing / Verification

The implemented flows have been verified through the project development workflow and focused frontend smoke checks, including:

- Signup, login validation, password visibility controls, and authentication error states.
- Protected dashboard access and logout behavior.
- Poll creation validation, dynamic option add/remove behavior, and navigation after creation.
- My Polls close and delete confirmation flows.
- Poll detail option selection, vote submission feedback, and disabled recorded-vote state.
- Live result rendering and WebSocket message handling using the existing poll update format.
- Results and analytics rendering from existing API-shaped data.
- Responsive rendering checks for mobile layouts.
- Backend compilation with `go build ./...`.

## Future Improvements

- Add automated frontend and backend integration test suites.
- Add pagination or search when poll collections grow significantly.
- Add operational monitoring and structured production logging.

## License

This project is currently not licensed.

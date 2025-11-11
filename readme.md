# Secret Friend Web App (Pikkado-style)

A mobile-first web app to organize Secret Santa/Secret Friend games without requiring accounts. Each participant receives a unique link to reveal their assigned person.

---

## Overview

Organizer creates a game, adds participants, and triggers a random draw that prevents self-assignment. Frontend emphasizes a clean mobile experience (glassmorphism). Backend uses FastAPI for a lightweight, fast API.

---

## Agreed Scope and Rules

- Admin panel protected by a simple password.
- Admin can edit participants and redo the draw.
- Links never expire unless manually deactivated/reactivated.
- Minimum participants: 3. No duplicate names within a game.
- Reveal flow: confirmation step before revealing. Reopening a used link shows a friendly message.
- Persistence (initial): local JSON file on the organizer’s machine; the server is the source of truth. Client may cache, but "viewed" is stored server-side.
- Game lifetime: indefinite.
- Frontend shows shareable links and one-click WhatsApp sharing.

---

## System Flow

1. Admin creates a game (title, password, names).
2. System generates tokens and links for each participant.
3. Admin shares links (copy/WhatsApp).
4. Participant opens link → confirmation screen → reveal.
5. Server marks token as viewed; reopening shows a friendly message.

---

## API Specification (FastAPI)

Authentication for admin endpoints: send `X-Admin-Password: <password>` header. Participant endpoints use the unique token within the URL.
Global directory endpoints (optional) use `X-Master-Password: <password>` if `MASTER_ADMIN_PASSWORD` is set in env.

- Create game
  - POST `/api/games`
  - Body: `{ "title": "Holiday 2025", "admin_password": "secret123", "participants": ["Ana","Luis","Carla"] }`
  - Responses:
    - 201 `{ "game_id": "ABC123", "share_base_url": "https://app.example.com" }`
    - 400 on invalid input (duplicates, < 3 participants)

- Get game status [admin]
  - GET `/api/games/{id}` with `X-Admin-Password`
  - 200 `{ game_id, title, created_at, participants: [{ id, name, token, viewed, active }], any_revealed }`
  - 401 invalid password, 404 not found

- List shareable links [admin]
  - GET `/api/games/{id}/links` with `X-Admin-Password`
  - 200 `[ { name, link } ]`

- Add participants [admin]
  - POST `/api/games/{id}/participants` with `X-Admin-Password`
  - Body: `{ "participants": ["Julia","Marco"] }`
  - 200 `{ added: [{ id, name }] }` or 400 on duplicates

- Remove participant [admin]
  - DELETE `/api/games/{id}/participants/{participant_id}` with `X-Admin-Password`
  - 204 on success, 404 if not found

- Redo draw [admin]
  - POST `/api/games/{id}/draw` with `X-Admin-Password`
  - Body (optional): `{ "force": false }`
  - 200 `{ assignment_version }`; 409 if any participant already revealed and `force=false`

- Deactivate/reactivate link [admin]
  - POST `/api/games/{id}/{token}/deactivate` with `X-Admin-Password`
  - POST `/api/games/{id}/{token}/reactivate` with `X-Admin-Password`
  - 200 on success; 404 if token not found

- Participant preview (non-consuming)
  - GET `/api/games/{id}/{token}`
  - 200 `{ name, viewed, can_reveal: true|false }` or 404 if not found/inactive

- Reveal (consuming)
  - POST `/api/games/{id}/{token}/reveal`
  - 200 first time `{ assigned_to }`; 409 on subsequent calls with a friendly message

Common status codes: 400 validation, 401 admin auth error, 404 not found, 409 conflict.

Global people directory (optional)
- GET `/api/people` → list global participants `{ id, name, active }`
- POST `/api/people` [master] body `{ names: ["Ana","Luis"] }` → add/activate people
- PATCH `/api/people/{id}` [master] `{ name }` → rename
- POST `/api/people/{id}/deactivate|reactivate` [master]

---

## Data Model (SQLite persistence)

The backend now uses a simple SQLite file as the single source of truth on the organizer's machine. All devices read/write via the backend API; clients must not cache state.

- Location: `backend/data.sqlite` (created on first run)
- A lightweight KV store keeps the full state; existing `backend/data.json` is auto-migrated on first run and kept as a backup (`data.json.bak`).

Example in-memory structure (serialized into the KV store):

```json
{
  "game_id": "ABC123",
  "title": "Holiday 2025",
  "admin_password_hash": "<bcrypt>",
  "created_at": "2025-11-11T10:00:00Z",
  "updated_at": "2025-11-11T10:00:00Z",
  "assignment_version": 1,
  "any_revealed": false,
  "participants": [
    { "id": "p1", "name": "Ana", "token": "1f92f8a9c4f0a1b2", "assigned_to_participant_id": "p3", "viewed": false, "viewed_at": null, "active": true },
    { "id": "p2", "name": "Luis", "token": "a8c3e9d4e1c2f3b4", "assigned_to_participant_id": "p1", "viewed": true,  "viewed_at": "2025-11-11T10:10:00Z", "active": true },
    { "id": "p3", "name": "Carla", "token": "b9f1c2e5d6a7b8c9", "assigned_to_participant_id": "p2", "viewed": false, "viewed_at": null, "active": true }
  ]
}
```

Rules:
- Names must be unique per game; min size is 3.
- Draw prevents self-assignment; redraw blocked after reveals unless `force=true`.
- Token length ≥ 16, random; store `viewed` only on reveal.

---

## Frontend Notes

- Tech: React + Vite + TailwindCSS; glassmorphism (translucent background, blur, soft shadows).
- Admin: create game, copy/share links, manage participants, redo draw, toggle links.
- Participant: confirmation screen before reveal; reopen shows a friendly message.
- WhatsApp share: prefilled message with the unique URL.

---

## Setup & Run

Prerequisites:
- Python 3.11+
- Node.js 18+

Backend (FastAPI):
- Install: `pip install fastapi uvicorn[standard] pydantic bcrypt python-multipart`
- Env: `SHARE_BASE_URL` (e.g., `http://localhost:5173`)
- Dev run: `uvicorn backend.main:app --reload`
- Data file: `backend/data.json` (created on first run)

Frontend (React + Vite + Tailwind):
- Install deps: `npm install`
- Dev run: `npm run dev`

Security notes:
- Configure CORS for your frontend origin.
- Prefer `Referrer-Policy: no-referrer` when serving participant links.

---

## Roadmap (next)

- Implement backend endpoints and local JSON persistence.
- Scaffold frontend pages: CreateGame, GameLinks, ViewResult.
- Add WhatsApp share and copy-to-clipboard.
- Add confirm-before-reveal flow and friendly re-open state.

---

## License

MIT License

# Frendo — Secret Friend Web App

Frendo is a mobile-first full-stack application for organizing Secret Friend / Secret Santa games without requiring participant accounts. An organizer creates a game, performs the draw and shares a unique link with each participant.

The project is also an applied-AI experiment: gift recommendations use a generative model, while the draw, permissions, budget validation and persistence remain deterministic.

## Highlights

- Create and manage Secret Friend games.
- Global people directory for reusable participants.
- Random draw that prevents self-assignment.
- Unique participant tokens and one-time reveal flow.
- Admin controls to redraw, rename participants and activate/deactivate links.
- Wish lists per participant.
- One-click WhatsApp sharing and QR flows.
- SQLite persistence with migration from the original JSON store.
- Unit tests for services, validators and AI-output validation.
- Bilingual UI (Spanish / English).

## Applied AI: Smart Gift Assistant

After revealing a Secret Friend, the participant can provide:

- maximum budget,
- interests,
- relationship/context,
- optional notes.

The backend combines that input with the recipient's wishlist and requests gift ideas from the OpenAI Responses API. Model output is treated as untrusted data: it is parsed, deduplicated and validated before reaching the frontend.

### AI vs deterministic logic

**AI handles**
- interpreting preferences,
- generating gift alternatives,
- explaining why each suggestion may fit.

**Traditional logic handles**
- the draw and assignment rules,
- authentication/token access,
- game and link state,
- budget enforcement,
- persistence,
- permissions and business rules.

Suggestions whose estimated price exceeds the user's budget are discarded by backend logic. The model cannot modify the game, participant list, assignments or wish lists.

See [`docs/AI_GIFT_ASSISTANT.md`](docs/AI_GIFT_ASSISTANT.md) for the design rationale and data flow.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Python 3.11+
- FastAPI
- Pydantic
- SQLite
- bcrypt
- OpenAI Responses API

## Architecture

```text
Frontend (React + TypeScript)
          |
          v
      REST API
          |
          v
FastAPI routers
          |
          v
Business services
     |          |
     v          v
Repositories   AI service
     |          |
     v          v
SQLite      OpenAI API
```

Backend responsibilities are separated into routers, services, repositories, validation and storage layers.

## Main API Flows

### Games
- `POST /api/games`
- `GET /api/games/{game_id}`
- `POST /api/games/{game_id}/draw`
- `GET /api/games/{game_id}/links`

### Participant
- `GET /api/games/{game_id}/{token}`
- `POST /api/games/{game_id}/{token}/reveal`
- `GET /api/games/{game_id}/{token}/wishlist`
- `POST /api/games/{game_id}/{token}/wishlist`

### Applied AI
- `POST /api/games/{game_id}/{token}/gift-suggestions`

Example request:

```json
{
  "budget": 30,
  "interests": ["coffee", "running"],
  "relationship": "coworker",
  "notes": "prefers practical gifts",
  "count": 5,
  "language": "en"
}
```

## Local Setup

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Configure environment variables using `.env.example`:

```env
SHARE_BASE_URL=http://localhost:5173
FRONTEND_ORIGINS=http://localhost:5173
MASTER_ADMIN_PASSWORD=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

Keep `OPENAI_API_KEY` server-side. It must never be exposed in Vite/frontend environment variables.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_BASE` when the API is hosted on a different origin.

## Tests

```bash
python -m unittest \
  backend.tests.test_services \
  backend.tests.test_validators \
  backend.tests.test_ai_gift_service
```

## Engineering Notes

Frendo intentionally avoids using AI for deterministic business logic. The AI integration is isolated behind a service boundary, so the core Secret Friend application remains usable even when the model provider is unavailable or not configured.

## License

MIT

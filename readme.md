# 🎁 Secret Friend Web App (Pikkado-like)

A simple web app to organize **Secret Santa / Secret Friend** games without requiring users to log in or create accounts.  
Each participant receives a **unique link** to discover who they have to gift, just like [Pikkado](https://pikkado.com).

---

## 🚀 Project Overview

This project allows a group organizer to create a game, register participants, and automatically assign each person a random "secret friend".  
The app generates **unique access links** per participant — no usernames, passwords, or sign-ins required.

### Main Flow

1. The organizer visits the web app and creates a new game:
   - Adds a list of participant names.
   - Optionally defines exclusions (e.g., “John can’t get Mary”).
   - Clicks **“Generate links”**.
2. The system:
   - Randomly assigns each participant another person.
   - Creates a unique tokenized URL for each one:
     ```
     https://mysecretfriend.app/game/ABC123/token/1f92f8a9
     ```
   - Stores the assignments in a small database (or JSON).
3. The organizer shares each link privately.
4. Each participant opens their link and sees **only** their assigned friend:
   ```
   "You are the secret friend of Carla 🎁"
   ```
5. Tokens can be marked as “viewed” so that the same link cannot reveal the result again.

---

## 🧩 Key Features

- ✅ No authentication (no accounts, no passwords).
- 🔒 Unique link with secure random token.
- 🎲 Random but non-repetitive assignment.
- 🚫 Self-assignment prevented (A ≠ A).
- 🗃️ Optional: save results in a small backend (FastAPI, Node.js, or Firebase).
- 📱 Mobile-friendly and shareable via WhatsApp or email.

---

## 🎗️ Suggested Architecture

**Frontend:**  
- React / Vite or plain HTML + JS.  
- Fetch API for backend communication.  
- Simple routes:
  - `/create` → create a new game.
  - `/game/:id` → game summary.
  - `/join/:token` → participant view.

**Backend:**  
- Python (FastAPI) or Node.js (Express).
- REST endpoints:
  ```
  POST /api/games          -> create game
  POST /api/games/:id/add  -> add participants
  POST /api/games/:id/draw -> randomize assignments
  GET  /api/games/:id/:token -> get assigned person
  ```
- Data stored in memory, JSON file, or lightweight DB (e.g. SQLite, Firestore).

---

## 🧮 Example Data Structure

```json
{
  "game_id": "ABC123",
  "participants": [
    { "name": "Gary", "token": "1f92f8a9", "assigned_to": "Lily", "viewed": false },
    { "name": "Lily", "token": "a8c3e9d4", "assigned_to": "Robert", "viewed": true },
    { "name": "Robert", "token": "b9f1c2e5", "assigned_to": "Gary", "viewed": false }
  ]
}
```

---

## 💡 Future Ideas

- Add email sending for invitations.
- Allow custom messages or gift preferences.
- Add option for “couple exclusions”.
- Deploy backend on Render / Vercel / Firebase Functions.

---

## 🧰 Tech Stack (suggested)

| Layer | Tech |
|-------|------|
| Frontend | React / Vite / Tailwind |
| Backend | FastAPI or Express |
| Database | SQLite / Firebase / JSON file |
| Hosting | Vercel / Render / Netlify |

---

## 🧐 Goal for Codex

Generate:
- REST API endpoints.
- Random assignment logic with no self-pairs.
- Simple UI pages for creation, game summary, and participant view.
- Token generation and basic data persistence.

Focus on **clarity, simplicity, and privacy** — one link per person, no accounts, no reuse.

---

## 📄 License

MIT License — feel free to use and modify.

# frendo_project

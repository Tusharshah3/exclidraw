Exclidraw – Real-Time Collaborative Whiteboard

A fully real-time, Excalidraw-like drawing application built with WebSockets, Next.js, PostgreSQL, Prisma, and a custom rendering engine.

📌 Overview

Exclidraw is a collaborative whiteboard application where multiple users can draw, write, erase, move, resize, and edit shapes in real time—similar to Excalidraw or Google Jamboard.

It is built as a monorepo using TurboRepo, separating:

Frontend (Next.js)

HTTP Backend (Node.js + Express + Prisma)

WebSocket Backend (ws)

Shared libs (types, DB, utils)

🎯 What This App Solves

Most existing online whiteboards are complex or paid.
This project solves:

Instant collaboration – multiple users draw together.

Cross-device editing – works in browser, mobile, touchscreen.

Persistent canvas – saved to PostgreSQL automatically.

Real-time broadcasting – no reload required.

Undo/Redo per user – maintain local drawing history while syncing globally.

It is a complete real-time system that demonstrates concurrency control, CRDT-like behavior, client-side rendering, and synchronized canvas state.

✨ Key Features
🖊️ Drawing Tools

Pencil (smooth freehand paths)

Line tool

Arrow tool

Rectangle

Diamond

Circle

Text Tool

Eraser

Move/Hand tool

Resize selected shapes

Selection tool

Bring-to-front reordering

Stroke width + color controls

🧠 Real-Time Collaboration

WebSocket syncing for:

draw, update, delete

undo / redo

reorder layers

Conflict-free updates using tempIds → serverId mapping

Server broadcasts shape updates to all users in the room

🔒 Authentication + Rooms

JWT-based authentication

User can Create Room / Join Room

Each room maintains its own canvas + participants

Late joiners receive full canvas state from HTTP API

⚡ Performance

requestAnimationFrame rendering loop

Offscreen world transformations (zooming, panning)

Only draw shapes that changed

Optimized pencil smoothing with Ramer–Douglas–Peucker algorithm

🧭 Canvas Controls

Zoom In/Out

Pan / Spacebar drag

Reset camera

World-to-Screen + Screen-to-World coordinate system

🧵 Undo / Redo (local + synced)

Each client maintains:

undoStack

redoStack

Undo/Redo also broadcast to the room

When a user disconnects:

the server can optionally persist final state

🏗️ Architecture
apps/
 ├── http-backend/        → REST API (rooms, auth, initial shapes)
 ├── ws-backend/          → Real-Time WebSocket Server
 └── frontend/            → Next.js Whiteboard UI

packages/
 ├── db/                  → Prisma schema + client
 ├── backend-common/      → Shared config (JWT, constants)
 └── shared/              → Zod types, TS utils

Architecture Flow
         ┌──────────────────────┐
         │      Frontend        │
         │  (Next.js + Canvas)  │
         └──────────┬───────────┘
                    │
          WebSocket │ Real-time updates
                    ▼
         ┌──────────────────────┐
         │     WS Backend       │
         │ (ws, tempId→id sync) │
         └──────────┬───────────┘
                    │
                    │ Save, update, delete shapes
                    ▼
         ┌──────────────────────┐
         │     PostgreSQL       │
         │     (via Prisma)     │
         └──────────┬───────────┘
                    │
     Initial Load   │ HTTP (GET /room/:id/shapes)
                    ▼
         ┌──────────────────────┐
         │    HTTP Backend      │
         └──────────────────────┘

🧰 Tech Stack
Frontend

Next.js 14 (App Router)

TypeScript

TailwindCSS (UI)

Canvas 2D API (custom rendering engine)

requestAnimationFrame for optimized redraw

Backend

Node.js (Express)

ws (WebSocket server)

JWT for auth

Prisma ORM

PostgreSQL database

Monorepo

pnpm

TurboRepo

Shared packages for types/client/environment

🚀 Installation & Setup
1. Clone the repo
git clone https://github.com/Tusharshah3/exclidraw.git
cd exclidraw
pnpm install

2. Set environment variables

Create .env in:

apps/http-backend

apps/ws-backend

packages/db

Include:

DATABASE_URL=postgresql://...
JWT_SECRET=yourSecret

3. Migrate database
cd packages/db
pnpm prisma migrate dev

4. Start all services
pnpm dev

🧪 How Concurrency Is Solved
✔ TempId → ServerId Sync

When a user draws:

A shape is created with a temporary ID (pending-1234)

Sent immediately to WebSocket server

Server saves it and broadcasts:

{ id: 57, tempId: "pending-1234", shape: {...} }


Client replaces the pending shape with real server ID

👉 No duplicates
👉 No conflict on creation

✔ Server is always the source of truth for updates

Every update (resize/move/edit) is sent to WS server

Server writes to DB → broadcasts to everyone

All clients replace the local version with server version

👉 Prevents race conditions
👉 Later update always wins

✔ Undo / Redo (local + synced)

Each client stores snapshots:

undoStack = [state1, state2, ...]
redoStack = []


Undo/Redo actions:

Modify local canvas

Broadcast new state via WebSocket

Other clients replace their state

🎨 Screenshots (add your own)
📍 Whiteboard
📍 Rooms Dashboard
📍 Real-time cursor movement
📍 Tools panel
📍 Shape drawing example

🏆 What You Accomplished

Built a complete real-time collaborative drawing engine from scratch

Implemented pencil smoothing, resize handles, snapping, and shape previews

Designed a real-time protocol (temp ids, sync events, update collisions)

Built a fully working concurrency-safe drawing system

Implemented zoom, pan, camera transformations

Designed a modular monorepo architecture

Implemented Undo/Redo system that syncs across clients

Built production-ready WebSocket backend with reconnection + heartbeat

🔮 Future Improvements

Live cursors of other users

Multi-user awareness (colors per user)

Export board to PNG / SVG / JSON

Offline-first (CRDT/Yjs integration)

Better text editing (rich text)

Grouping shapes

Collaboration cursors + user highlights

📚 License

MIT — free to use, modify, and share.

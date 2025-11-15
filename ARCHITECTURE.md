ARCHITECTURE.md
Exclidraw – Real-Time Collaborative Whiteboard
******Overview

Exclidraw is a fully real-time collaborative whiteboard built using a monorepo architecture powered by TurboRepo, pnpm, and shared internal packages.

The system has three main backend components:

HTTP Backend (REST API) – Loads initial canvas state & handles persistent room logic

WebSocket Backend – Handles real-time syncing (draw, update, delete, undo/redo)

PostgreSQL + Prisma – Stores shapes, rooms, users

And one frontend:

Next.js Frontend – Canvas rendering engine, UI, tools, events, optimistic updates

******Repository Structure (Monorepo)
.
├── apps/
│   ├── frontend/          # Next.js UI + Canvas engine
│   ├── http-backend/      # Express REST API
│   └── ws-backend/        # WebSocket server
│
├── packages/
│   ├── db/                # Prisma schema + database client
│   ├── backend-common/    # JWT secret, env config, utilities
│   └── shared/            # Zod types, interfaces, helpers
│
└── turbo.json             # Turborepo pipeline

****** high-Level Architecture
                    ┌────────────────────────────┐
                    │        Frontend UI         │
                    │  Next.js + Canvas Engine   │
                    └─────────────┬──────────────┘
                                  │
                   Initial load   │      Real-time sync
                         REST     │      WebSockets
                                  ▼
             ┌──────────────────────────────┐
             │        WebSocket Server      │
             │   tempId sync, undo/redo     │
             └──────────────┬──────────────┘
                            │
           save/update/delete shape in DB
                            ▼
            ┌─────────────────────────────┐
            │       PostgreSQL + Prisma   │
            │   persistent drawing state  │
            └─────────────────────────────┘
                            ▲
                            │
                     getExistingShapes()
                            │
            ┌─────────────────────────────┐
            │         HTTP Backend        │
            │  room creation, auth, list  │
            └─────────────────────────────┘

******** Real-Time Sync Architecture
Why WebSocket is required

Canvas operations (pencil, resize, move, erase, undo/redo) happen every few milliseconds.
REST cannot handle this load.
WebSocket is ideal because:

Persistent 2-way connection

Low overhead

Broadcast support

Real-time synchronization

🔌 WebSocket Message Types
Event	Sent By	Purpose
chat	Client → Server	Create a new shape
update	Client → Server	Move/resize/edit shape
delete	Client → Server	Remove shape
reorder	Client → Server	Bring-to-front
undo / redo	Client → Server	Restore previous canvas
broadcast	Server → Clients	Sync updated state to everyone
*******Concurrency Strategy
✔ 1. Optimistic UI With tempId → serverId

When a user draws:

Client immediately displays shape using pending-1234

Sends it to server

Server saves in DB, returns:

{ id: 58, tempId: "pending-1234" }


Client replaces pending shape with actual DB ID.

👉 No duplicates
👉 Local UI feels instant
👉 Handles multiple users drawing fast

✔ 2. Server Is Single Source of Truth

Each update overwrites DB record

Server broadcasts authoritative shape to all clients

Every client replaces local version

👉 No race conditions
👉 Simple deterministic state

✔ 3. Undo / Redo with Local Stacks

Every user maintains:

undoStack = []
redoStack = []


When undo is pressed:

Client applies previous snapshot

Broadcasts state → server

Server broadcasts to all clients

👉 Everyone stays in sync
👉 Works even during concurrency

🛠️ HTTP Backend Architecture
Responsibilities

JWT auth + token verification

Room creation / join

Fetch existing shapes for late joiners

Fetch user rooms

Prisma → PostgreSQL communication

Example Endpoint Flow
GET /room/:id/shapes
 ├─ verify JWT
 ├─ prisma.chat.findMany()
 └─ return list of shapes to frontend

🎨 Frontend Canvas Architecture
Core Components
1. Game.ts

Central drawing engine

Maintains:

shapes array

camera (zoom, pan)

selected tool

undo/redo stacks

Handles all events:

mousedown

mousemove

mouseup

keyboard shortcuts (Ctrl+Z, Ctrl+Y)

Calls:

drawShape()

clearCanvas()

selectTool

resizeTool

pencil tool

eraser tool

2. Tools

Each tool is a separate class:

Tool	Responsibility
Pencil	Freehand drawing with smoothing
Select Tool	Hit-testing, selecting shapes
Resize Tool	8 resize handles
Eraser	Collision-based erasing
Drawing Tools	Rect, circle, diamond, arrow, line
Text Tool	Text editing overlay
3. requestAnimationFrame() Rendering Loop

Used for:

Smooth pencil drawing

Smooth panning/zoom

Reducing redraw cost

*******Database Architecture
Prisma Schema (Simplified)
model Chat {
  id      Int      @id @default(autoincrement())
  roomId  Int
  userId  String
  message String?   // JSON string → shape data
  room    Room @relation(...)
  user    User @relation(...)
}

model Room {
  id    Int    @id @default(autoincrement())
  slug  String @unique
  chats Chat[]
}


Each shape = one row.

*******Authentication Architecture

JWT issued at login/signup

WebSocket uses token in URL:

ws://server.com?token=abc123


Server rejects invalid tokens

Each WebSocket client stored as:

{
  ws,
  userId,
  rooms: [],
  undoStack: [],
  redoStack: []
}

*******Deployment Architecture
Compatible With:
vercel render and docker
but i deploy using render

WebSocket backend uses:

HTTP upgrade → WebSocket

heartbeat pings → detect stale connections

📦 Why Monorepo?

Advantages:

Shared types between all apps

Single source of truth for Prisma

Faster builds via Turborepo

Shared ESLint/TSConfig/env

Easier to maintain microservices

🪜 Data Flow Summary
1. User draws a shape

→ Game.ts creates tempId
→ Add to canvas
→ Send to WS backend

2. WS backend saves shape

→ Write to PostgreSQL
→ Broadcast real ID

3. All clients replace pending shape

→ Redraw canvas

4. Undo/Redo

→ Local snapshot
→ Broadcast new state
→ Everyone syncs

📚 Conclusion

This architecture supports:

Multi-user real-time collaboration

Deterministic state synchronization

Fast local rendering

Reliable undo/redo

Persistent history using DB

It's scalable, modular, and easily extensible to features like:

multi-user cursors

CRDT/Yjs offline sync

enriched text editor

shape grouping

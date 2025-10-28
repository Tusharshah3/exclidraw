Excalidraw-like Collaborative Whiteboard

Real-time collaborative whiteboard built with Next.js, Prisma, WebSocket, and Redis (optional)

🧠 Overview

This project is a real-time collaborative drawing board, similar to Excalidraw
, where multiple users can draw, write, erase, and manipulate shapes on a shared canvas simultaneously.

It uses a modern full-stack architecture —

Next.js (frontend) for an interactive canvas UI

WebSocket (Node.js + ws) for real-time synchronization

Prisma ORM with PostgreSQL for persistent state

Redis (optional) for caching active room data

🚀 Features

✅ Real-time multi-user drawing
✅ Tools — Pencil, Rectangle, Circle, Arrow, Line, Diamond, TextBox, Select, Resize, Eraser
✅ Camera — Pan and Zoom support
✅ Live collaboration with instant shape updates
✅ Offline-first drawing (pending → synced IDs)
✅ Permanent storage (PostgreSQL)
✅ Secure JWT-based WebSocket authentication
✅ Automatic resync on reconnect
✅ Layer reordering and shape persistence

🧩 Architecture Overview
flowchart LR
A[User 1 Canvas] <-->|WebSocket| B[WebSocket Server]
A2[User 2 Canvas] <-->|WebSocket| B
B -->|Prisma ORM| C[(PostgreSQL DB)]
B -->|Cache state| D[(Redis - optional)]
C -->|HTTP GET| A
C -->|HTTP GET| A2


Flow Summary:

User draws → shape sent via WebSocket (chat event).

Server saves it in DB, then broadcasts to all users in the same room.

All clients receive update, render shape, and replace pending-* ID with server ID.

On reload, shapes are reloaded from DB via REST endpoint (getExistingShapes).

🧱 Tech Stack
Layer	Technology	Description
Frontend	Next.js (React + Canvas API)	User interface & drawing logic
Backend	Node.js + ws	Real-time WebSocket server
ORM	Prisma	Database ORM for PostgreSQL
Database	PostgreSQL	Stores rooms, users, shapes
Cache (optional)	Redis	Stores room state for quick replay
Auth	JWT	Secure user-level WebSocket access
⚙️ Installation
1️⃣ Clone the repo
git clone https://github.com/your-username/excalidraw-clone.git
cd excalidraw-clone

2️⃣ Install dependencies
pnpm install

3️⃣ Setup environment variables

Create a .env file:

DATABASE_URL="postgresql://user:password@localhost:5432/whiteboard"
JWT_SECRET="your_super_secret_key"
REDIS_URL="redis://localhost:6379"

4️⃣ Run migrations
pnpm prisma migrate dev

5️⃣ Start backend WebSocket server
pnpm tsx apps/backend/ws-server.ts

6️⃣ Start Next.js frontend
pnpm dev

🧠 Data Model (Prisma)
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  chats     Chat[]
}

model Room {
  id        Int      @id @default(autoincrement())
  name      String
  chats     Chat[]
}

model Chat {
  id        Int      @id @default(autoincrement())
  roomId    Int
  message   String?
  userId    String
  room      Room     @relation(fields: [roomId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

💬 WebSocket Events
Type	Description	Direction	Payload Example
join_room	Join a whiteboard session	Client → Server	{ type: "join_room", roomId: 21 }
chat	Create new shape	Client ↔ Server	{ type: "chat", tempId: "pending-1", shape: {...}, roomId: 21 }
update	Modify existing shape	Client ↔ Server	{ type: "update", id: 33, shape: {...}, roomId: 21 }
delete	Remove shape	Client ↔ Server	{ type: "delete", id: 33, roomId: 21 }
reorder	Change layer order	Client ↔ Server	{ type: "reorder", order: [12, 14, 11], roomId: 21 }
🧠 Real-Time Flow Example
sequenceDiagram
    participant U1 as User 1
    participant WS as WebSocket Server
    participant DB as PostgreSQL

    U1->>WS: { type: "chat", tempId: "pending-123", shape: {...} }
    WS->>DB: INSERT INTO Chat
    DB-->>WS: { id: 87 }
    WS-->>U1: { type: "chat", id: 87, tempId: "pending-123", shape: {...} }
    WS-->>OtherUsers: { type: "chat", id: 87, shape: {...} }

🧰 Core Frontend Files
File	Description
Game.ts	Core class controlling all drawing & WebSocket logic
pencil.ts	Pencil tool implementation
select.ts	Shape selection, hit-testing
resize.ts	Shape resizing handles
eraser.ts	Collision-based eraser
http.ts	Fetches shapes on reconnect
🔒 Security & Access Control

JWT authentication is mandatory for every connection.

Each user can only join authorized rooms.

Server verifies tokens and room IDs before adding users to room lists.

Malformed messages or oversized payloads are safely ignored.

⚡ Optimization

Debounced updates reduce WebSocket spam.

Shape re-rendering only redraws deltas.

Cached room states in Redis for faster recovery.

Offscreen Canvas (future feature) for performance boosts.

🧩 Future Improvements

✅ Add WebRTC for cursor position sync

✅ Add Undo/Redo stack (CRDT / OT based)

✅ Add collaborative text editing

✅ Add shape grouping and export as image

✅ Deploy backend on multiple nodes using Redis Pub/Sub

🧑‍💻 Author

Tushar shah   — Full Stack Engineer
📧 Tusharshah372003@gmail.com

🌐 your-portfolio-link

🧾 License

This project is licensed under the MIT License.
Feel free to use, modify, and distribute with attribution.

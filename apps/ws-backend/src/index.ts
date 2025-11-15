import "dotenv/config";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const PORT = Number(process.env.PORT) || 8080;


const server = http.createServer();
const wss = new WebSocketServer({ server });


// Types

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
  lastPing?: number;
}

interface StoredShape {
  id: string;
  shape: any;
}

interface RoomState {
  shapes: StoredShape[];       // All shapes in canvas
  undoStack: StoredShape[][];  // For undo
  redoStack: StoredShape[][];  // For redo
}

const users: User[] = [];
const rooms: Record<string, RoomState> = {};


// Helpers

function checkUser(token: string): string | null {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

function broadcastToRoom(roomId: string, payload: any) {
  const msg = JSON.stringify(payload);
  users.forEach((u) => {
    if (u.rooms.includes(roomId)) {
      try {
        u.ws.send(msg);
      } catch {}
    }
  });
}


// Heartbeat (keep connections alive)

function heartbeat() {
  const now = Date.now();

  for (let i = users.length - 1; i >= 0; i--) {
    const user = users[i];
    if (!user) continue; // strict-mode fix

    if (!user.lastPing || now - user.lastPing > 45000) {
      try {
        user.ws.terminate();
      } catch {}

      users.splice(i, 1);
    } else {
      try {
        user.ws.ping();
      } catch {}
    }
  }
}

setInterval(heartbeat, 30000);


// WS CONNECTION

wss.on("connection", async (ws, request) => {
  const url = request.url;
  if (!url) return ws.close();

  const params = new URLSearchParams(url.split("?")[1] || "");
  const token = params.get("token") || "";
  const userId = checkUser(token);

  if (!userId) return ws.close();

  const user: User = { ws, rooms: [], userId, lastPing: Date.now() };
  users.push(user);

  ws.on("pong", () => (user.lastPing = Date.now()));

  // -----------------------------
  // On client message
  // -----------------------------
  ws.on("message", async (raw) => {
    let data: any;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const roomId = String(data.roomId);
    const type = data.type;

    switch (type) {
      // ----------------------------
      // JOIN ROOM
      // ----------------------------
      case "join_room": {
        user.rooms.push(roomId);

        // Initialize room
        if (!rooms[roomId]) {
          rooms[roomId] = {
            shapes: [],
            undoStack: [],
            redoStack: [],
          };

          // Load existing DB state
          const existing = await prismaClient.chat.findMany({
  where: { roomId: Number(roomId) },
  orderBy: { id: "asc" },
});

rooms[roomId].shapes = existing
  .map((entry) => {
    if (!entry.message) return null;

    let parsed: any;
    try {
      parsed = JSON.parse(entry.message);
    } catch {
      return null;
    }

    if (!parsed?.shape) return null;

    return {
      id: String(entry.id),
      shape: parsed.shape,
    };
  })
  .filter(Boolean) as StoredShape[];

        }

        // Send room state to the joining user
        ws.send(
          JSON.stringify({
            type: "room_state",
            roomId,
            shapes: rooms[roomId].shapes,
          })
        );
        break;
      }

      // ----------------------------
      // LEAVE ROOM
      // ----------------------------
      case "leave_room":
        user.rooms = user.rooms.filter((r) => r !== roomId);
        break;

      // ----------------------------
      // CREATE SHAPE
      // ----------------------------
      case "chat": {
        const r = rooms[roomId];
        if (!r) return;

        // Save snapshot for undo
        r.undoStack.push(JSON.parse(JSON.stringify(r.shapes)));
        r.redoStack = [];

        const tempId = data.tempId;

        const newShape: StoredShape = {
          id: `local-${Date.now()}`,
          shape: data.shape,
        };

        r.shapes.push(newShape);

        broadcastToRoom(roomId, {
          type: "chat",
          id: newShape.id,
          tempId,
          shape: newShape.shape,
          roomId,
        });

        break;
      }

      // ----------------------------
      // UPDATE SHAPE
      // ----------------------------
      case "update": {
        const r = rooms[roomId];
        if (!r) return;

        r.undoStack.push(JSON.parse(JSON.stringify(r.shapes)));
        r.redoStack = [];

        const idx = r.shapes.findIndex(s => s.id === data.id);
          const existing = r.shapes[idx];
          if (existing) {
            existing.shape = data.shape;
          }




        broadcastToRoom(roomId, {
          type: "update",
          id: data.id,
          shape: data.shape,
          roomId,
        });

        break;
      }

      // ----------------------------
      // DELETE SHAPE
      // ----------------------------
      case "delete": {
        const r = rooms[roomId];
        if (!r) return;

        r.undoStack.push(JSON.parse(JSON.stringify(r.shapes)));
        r.redoStack = [];

        r.shapes = r.shapes.filter((s) => s.id !== data.id);

        broadcastToRoom(roomId, {
          type: "delete",
          id: data.id,
          roomId,
        });

        break;
      }

      // ----------------------------
      // UNDO
      // ----------------------------
      case "undo": {
        const r = rooms[roomId];
        if (!r || r.undoStack.length === 0) return;

        r.redoStack.push(JSON.parse(JSON.stringify(r.shapes)));
        r.shapes = r.undoStack.pop()!;

        broadcastToRoom(roomId, {
          type: "undo",
          shapes: r.shapes,
          roomId,
        });

        break;
      }

      // ----------------------------
      // REDO
      // ----------------------------
      case "redo": {
        const r = rooms[roomId];
        if (!r || r.redoStack.length === 0) return;

        r.undoStack.push(JSON.parse(JSON.stringify(r.shapes)));
        r.shapes = r.redoStack.pop()!;

        broadcastToRoom(roomId, {
          type: "redo",
          shapes: r.shapes,
          roomId,
        });

        break;
      }
    }
  });

  
  // On WebSocket close
  
  ws.on("close", async () => {
    const i = users.findIndex((u) => u.ws === ws);
    if (i !== -1) users.splice(i, 1);
      const u = user;
      if (!u) return;
    // Persist room state if this was last user
    for (const roomId of user.rooms) {
      const stillActive = users.some((u) => u.rooms.includes(roomId));
      if (!stillActive) {
        const r = rooms[roomId];
        if (!r) continue;

        console.log("Persisting final state for room", roomId);

        await prismaClient.chat.deleteMany({
          where: { roomId: Number(roomId) },
        });

        await prismaClient.chat.createMany({
          data: r.shapes.map((s) => ({
            roomId: Number(roomId),
            userId: user.userId,
            message: JSON.stringify({ shape: s.shape }),
          })),
        });

        delete rooms[roomId];
      }
    }
  });

  ws.on("error", () => {});
});

server.listen(PORT, () =>
  console.log(`WS Server running on ws://localhost:${PORT}`)
);

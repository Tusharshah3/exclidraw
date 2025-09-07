import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) return null;
    return decoded.userId as string;
  } catch (e) {
    console.error("[AUTH] JWT verification failed:", e);
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1] || "");
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);
  if (!userId) {
    console.warn("[WS] Connection rejected: invalid token");
    ws.close();
    return;
  }

  const user: User = { ws, rooms: [], userId };
  users.push(user);
  console.log(`[WS] User connected: ${userId}, total users: ${users.length}`);

  ws.on("message", async function message(data) {
    let parsedData: any;
    try {
      parsedData = typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
    } catch (e) {
      console.error("[WS] Invalid JSON received:", data);
      return;
    }

    // -------------------------
    // JOIN / LEAVE ROOM
    // -------------------------
    if (parsedData.type === "join_room") {
      user.rooms.push(parsedData.roomId);
      console.log(`[ROOM] User ${user.userId} joined room ${parsedData.roomId}`);
      return;
    }
    if (parsedData.type === "leave_room") {
      user.rooms = user.rooms.filter((r) => r !== parsedData.roomId);
      console.log(`[ROOM] User ${user.userId} left room ${parsedData.roomId}`);
      return;
    }

    console.log("[WS] Message received:", parsedData);

    // -------------------------
    // CREATE SHAPE (chat)
    // -------------------------
    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      console.log(`[CHAT] User ${userId} -> Room ${roomId}, saving shape`);

      let saved;
      try {
        saved = await prismaClient.chat.create({
          data: {
            roomId: Number(roomId),
            message,
            userId,
          },
        });
        console.log(`[DB] Shape stored with id ${saved.id} for room ${roomId}`);
      } catch (e) {
        console.error("[DB] Error storing shape:", e);
        return;
      }

      let parsedMessageObj: any = null;
      try {
        parsedMessageObj = JSON.parse(message);
      } catch (e) {
        console.error("[WS] Failed to parse shape JSON from message:", message);
      }

      users.forEach((u) => {
        if (u.rooms.includes(String(roomId))) {
          try {
            u.ws.send(
              JSON.stringify({
                type: "chat",
                id: saved.id,
                shape: parsedMessageObj ? parsedMessageObj.shape : parsedMessageObj,
                roomId,
              })
            );
          } catch (e) {
            console.warn("[WS] Failed to forward chat message to client:", e);
          }
        }
      });
      return;
    }

    // -------------------------
    // DELETE SHAPE
    // -------------------------
    if (parsedData.type === "delete") {
      const roomId = parsedData.roomId;
      const shapeId = parsedData.id;

      console.log(`[DELETE] User ${userId} -> Room ${roomId}, deleting shape ${shapeId}`);

      try {
        await prismaClient.chat.delete({ where: { id: shapeId } });
        console.log(`[DB] Shape ${shapeId} deleted from DB`);
      } catch (e) {
        console.error(`[DB] Error deleting shape ${shapeId}:`, e);
      }

      users.forEach((u) => {
        if (u.rooms.includes(String(roomId))) {
          try {
            u.ws.send(
              JSON.stringify({
                type: "delete",
                id: shapeId,
                roomId,
              })
            );
          } catch (e) {
            console.warn("[WS] Failed to forward delete event to client:", e);
          }
        }
      });
      return;
    }

    console.warn("[WS] Unknown message type:", parsedData.type);
  });

  ws.on("close", () => {
    console.log(`[WS] User disconnected: ${user.userId}`);
    const idx = users.findIndex((x) => x.ws === ws);
    if (idx !== -1) users.splice(idx, 1);
    console.log(`[WS] Active users: ${users.length}`);
  });
});

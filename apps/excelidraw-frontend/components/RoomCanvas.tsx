"use client";

import { useEffect, useRef,useState } from "react";
import { Canvas } from "./Canvas";
import { initDraw } from "@/draw";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("No auth token found.");
        return;
    }
    
    // Connect to your WebSocket server with the user's token
    const ws = new WebSocket(`ws://localhost:8081?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setSocket(ws);
      const data = JSON.stringify({
        type: "join_room",
        roomId
      });
      ws.send(data);
    };

    return () => {
        ws.close();
    }
  }, [roomId]); // Re-run effect if roomId changes

  if (!socket) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        Connecting to canvas server...
      </div>
    );
  }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}

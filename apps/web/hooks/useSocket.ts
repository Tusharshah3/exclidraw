import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket() {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMjZiZmFjZi1mZTdhLTRhMTAtOWU3Mi00MjEyOWExNjEwYTkiLCJpYXQiOjE3NTYwOTczOTN9.pIKbfCM5VdSikospSaw88cEKpJar7HsXCK5c9PpUrio`);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    }, []);

    return {
        socket,
        loading
    }

}
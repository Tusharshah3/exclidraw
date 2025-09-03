'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { Canvas } from '@/components/Canvas'; 
import { AlertModal } from '@/components/AlertModal';

interface Room { 
  id: number; 
  slug: string; 
}

const RoomPage = () => {
  const router = useRouter();
  // --- 3. Get the slug using the hook. It returns a simple object. ---
  const params = useParams();
  const slug = params.slug as string; // Cast to string for type safety

  const [room, setRoom] = useState<Room | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/signin'); return; }

    const setupPage = async () => {
      try {console.log("Attempting to connect to WebSocket server...");
       
        const roomRes = await axios.get(`http://localhost:3001/room/${slug}`, { headers: { Authorization: `Bearer ${token}` } });
        const roomData = roomRes.data.room;
        if (!roomData) {
          setAlert({ show: true, message: "This room does not exist. Redirecting..." });
          setTimeout(() => router.push('/dashboard'), 3000);
          return;
        }
        setRoom(roomData);
        const ws = new WebSocket(`ws://localhost:8081?token=${token}`);
        setSocket(ws);
        setIsLoading(false);
        console.log("WebSocket connection established.");

        ws.onopen = () => {
          console.log("WebSocket connection opened.");
        };
      } catch (error) {
        setAlert({ show: true, message: "Failed to load the room. Redirecting..." });
        setTimeout(() => router.push('/dashboard'), 3000);
      }
    };
    
    if (slug) {
        setupPage();
    }
    
    return () => socket?.close();
  }, [slug, router]); 
  
  if (alert.show) return <AlertModal message={alert.message} />;
  if (isLoading || !room || !socket) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading Creative Space...</div>;

  return (
    <div className="h-screen w-full bg-slate-900 text-white flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex justify-between items-center">
            {/* <div className="flex items-center gap-4 bg-slate-800/50 backdrop-blur-md border border-slate-700 p-2 rounded-lg">
                <Link href="/dashboard" className="p-2 rounded-md hover:bg-slate-700 transition-colors">
                    <Image src="/logo.svg" alt="App Logo" width={24} height={24} />
                </Link>
                <div className="w-[1px] h-6 bg-slate-600"></div>
                <h1 className="font-semibold">{room.slug}</h1>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                    <div className="w-9 h-9 bg-pink-500 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-sm">A</div>
                    <div className="w-9 h-9 bg-green-500 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-sm">B</div>
                </div>
            </div> */}
        </div>
      </header>
      
      <main className="flex-grow">
          <Canvas roomId={room.id.toString()} socket={socket} />
      </main>
    </div>
  );
};

export default RoomPage;
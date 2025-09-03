'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Navbar } from '@/components/Navbar';
import { CreateRoomModal } from '@/components/CreateRoomModal';
import { JoinRoomModal } from '@/components/joinroomModel';
import { RoomGrid } from '@/components/roomGrid';

interface Room {
  id: number;
  slug: string;
  updatedAt: string;
}

const DashboardPage = () => {
  const router = useRouter();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/signin');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3001/rooms', {
          headers: { Authorization: `? ${token}` },
        });
        // Sort rooms to show the most recently updated ones first
        setRooms(response.data.sort((a: Room, b: Room) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      } catch (err) {
        setError('Could not load your rooms.');
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
            // If the token is invalid, log the user out
            localStorage.removeItem('authToken');
            router.push('/signin');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/signin');
  };

  // This callback is passed to the CreateRoomModal.
  // A simple reload is fine for now to get the updated room list.
  const handleRoomCreated = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-fuchsia-300 to-fuchsia-100  font-sans">
      {/* The Navbar component is rendered here, with handlers for it buttons */}
      <Navbar 
        onNewRoomClick={() => setIsCreateModalOpen(true)}
        onJoinRoomClick={() => setIsJoinModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 lg:px-8 py-12">
        {/* The RoomGrid component displays the rooms and their states */}
        <RoomGrid
          isLoading={isLoading}
          error={error}
          rooms={rooms}
          onNewRoomClick={() => setIsCreateModalOpen(true)}
        />
      </main>
      
      {/* The modals are rendered here but are only visible when their `isOpen` state is true */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;


"use client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { JoinRoomModal } from "@/components/joinroomModel";
import Image from "next/image";
interface Room {
  id: number;
  slug: string;
  adminId: string;
  createdAt: string;
}

const HTTP_BACKEND_URL =
  process.env.NEXT_PUBLIC_HTTP_BACKEND_URL || "http://localhost:3001";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchRooms = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/signin"); // Redirect if not authenticated
        return;
      }
      try {
        const response = await axios.get(`${HTTP_BACKEND_URL}/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(response.data.rooms);
      } catch (err) {
        setError("Failed to fetch rooms. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/signin");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-300 via-blue-100 to-blue-40 text-black">
        <Loader2 className="w-6 h-6 animate-spin text-gray-900" />
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gradient-to-br from-blue-300 via-blue-100 to-blue-400 p-8 text-slate-700">
        
      <div className="max-w-7xl mx-auto ">
        
        <div className="flex justify-between items-center mb-10  text-white">
            <nav className="p-0">
            <Image src="/logo.svg" alt="App Logo" width={240} height={80} priority />
        </nav>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="flex justify-between items-center mb-10  text-white">
              <h1 className="text-4xl font-bold text-blue-900">Dashboard</h1>
        </div>
        {error && (
          <p className="text-red-600 p-3 rounded-md mb-6">
            {error}
          </p>
        )}

        {/* --- Create & Join Buttons --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-600 text-white hover:bg-blue-600/90 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold mb-4">Create a New Room</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full bg-blue-50 hover:bg-white text-blue-600 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Open Create Room Modal
            </button>
          </div>

          <div className="bg-blue-600 text-white hover:bg-blue-600/90 p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold mb-4">Join an Existing Room</h2>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full bg-blue-50 hover:bg-white text-blue-600 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Open Join Room Modal
            </button>
          </div>
        </div>

        {/* --- Room List --- */}
        <div>
          <h2 className="text-3xl font-semibold mb-6  text-blue-900">Your Rooms</h2>
          {rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.id}
                
                  className="bg-blue-600 hover:bg-blue-600/90 text-white hover:text-slate-200 p-6 rounded-lg shadow-lg flex justify-between items-center"
                >
                  <span className="text-xl font-medium">Room-Name : {room.slug} <br /> adminId : {room.adminId} <br /> roomid :{room.id} <br />created at:{new Date(room.createdAt).toLocaleString()}</span>
                  <button
                    onClick={() => router.push(`/canvas/${room.id}`)}
                    className="bg-blue-50 hover:bg-white text-blue-600 font-bold py-2 px-5 rounded-lg transition-colors"
                  >
                    Enter
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700">
              You haven't joined or created any rooms yet.
            </p>
          )}
        </div>
      </div>


      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={() => {
          // refresh rooms list after creation
          window.location.reload();
        }}
      />
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
}

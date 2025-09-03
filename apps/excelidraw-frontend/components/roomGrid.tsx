'use client';

import { useRouter } from 'next/navigation';
import { Plus, Users, MoreHorizontal } from 'lucide-react';

interface Room {
  id: number;
  slug: string;
  updatedAt: string;
}

interface RoomGridProps {
  isLoading: boolean;
  error: string | null;
  rooms: Room[];
  onNewRoomClick: () => void;
}

export const RoomGrid = ({ isLoading, error, rooms, onNewRoomClick }: RoomGridProps) => {
  const router = useRouter();

  const navigateToRoom = (slug: string) => {
    router.push(`/room/${slug}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-gray-400 mt-10">Loading your creative space...</div>;
    }

    if (error) {
      return <div className="text-center text-red-400 mt-10">{error}</div>;
    }

    if (rooms.length === 0) {
      // A more engaging Empty State
      return (
        <div className="text-center mt-10 py-16 px-6 border-2 border-dashed border-gray-700 rounded-xl bg-white/5">
          <h2 className="text-2xl font-semibold text-white">Your canvas awaits!</h2>
          <p className="mt-2 text-gray-400">Create your first collaborative room to bring your ideas to life.</p>
          <button
            onClick={onNewRoomClick}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/50"
          >
            <Plus size={20} />
            Create a Room
          </button>
        </div>
      );
    }

    // The redesigned Room Card Grid
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => navigateToRoom(room.slug)}
            className="group bg-slate-800/50 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 border border-slate-700 hover:border-blue-500 transition-all duration-300 ease-in-out transform hover:-translate-y-2 cursor-pointer"
          >
            {/* Visual Thumbnail Area */}
            <div className="h-40 bg-gradient-to-br from-gray-900 to-slate-800 rounded-t-xl flex items-center justify-center relative overflow-hidden">
              <span className="text-slate-600 font-bold text-lg">{room.slug}</span>
              <div className="absolute inset-0 bg-grid-slate-700/30 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0))]"></div>
            </div>
            {/* Information Area */}
            <div className="p-5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-white truncate">{room.slug}</h3>
                <button className="text-slate-400 hover:text-white transition-colors opacity-50 group-hover:opacity-100">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Last updated: {new Date(room.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex items-center mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center text-slate-400 text-sm">
                  <Users size={16} className="mr-2" />
                  <span>1 member</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">My Rooms</h1>
      {renderContent()}
    </div>
  );
};


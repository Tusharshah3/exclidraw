'use client';

import { useState, Fragment } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Transition, Dialog } from '@headlessui/react';
import { X, Palette } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

export const CreateRoomModal = ({ isOpen, onClose }: CreateRoomModalProps) => {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError("Room name cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('authToken');
    if (!token) {
        setError("Authentication error. Please log in again.");
        setIsLoading(false);
        return;
    }

    try {
      await axios.post(
        'http://localhost:3001/room',
        { name: roomName.trim() },
        { 
            headers: { 
                Authorization: `Bearer ${token}` // Standard way to send JWT
            } 
        }
      );
      onClose();
      router.push(`/room/${roomName.trim()}`);
    } catch (err) {
      console.error("Error creating room:", err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 411) {
          setError("A room with this name already exists.");
        } else if (err.response?.status === 403) {
            setError("Authentication failed. Your session may have expired. Please log in again.");
        } else {
          setError("Failed to create room. Please check the console for details.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
      setRoomName('');
      setError(null);
      setIsLoading(false);
      onClose();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-fuchsia-50 border border-fuchsia-700 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-fuchsia-700 flex justify-between items-center">
                  Create a New Room
                  <button onClick={handleClose} className="p-1 rounded-full hover:bg-fuchsia-700 hover:text-white transition-colors">
                      <X size={20} className="text-fuchsia-700 hover:text-white" />
                  </button>
                </Dialog.Title>
                <div className="mt-4">
                  <form onSubmit={handleSubmit}>
                    <p className="text-sm text-fuchsia-600 mb-4">Give your new collaborative space a name.</p>
                    <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g., Q4 Project Kick-off" className="w-full p-3 bg-white border border-fuchsia-600 rounded-md text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500" autoFocus />
                    
                    {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                    <div className="mt-6 flex justify-end gap-4">
                      <button type="button" onClick={handleClose} className="px-5 py-2 bg-fuchsia-600 rounded-md text-white hover:bg-fuchsia-500 font-semibold transition-colors">Cancel</button>
                      <button type="submit" disabled={isLoading} className="px-5 py-2 bg-fuchsia-600 text-white rounded-md hover:bg-fuchsia-500 font-semibold transition-colors disabled:bg-fuchsia-400/50">
                        {isLoading ? 'Creating...' : 'Create Room'}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
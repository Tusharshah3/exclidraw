'use client';

import { useState, Fragment } from 'react';
import axios from 'axios';
import { Transition, Dialog } from '@headlessui/react';
import { X, Send } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
}

export const InviteUserModal = ({ isOpen, onClose, roomId }: InviteUserModalProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('authToken');
    try {
      // This is the new backend endpoint we will need to create
      await axios.post(
        `http://localhost:3001/rooms/${roomId}/invite`,
        { email: email.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Invitation sent to ${email}!`);
      setEmail('');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "Failed to send invitation.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
      setEmail('');
      setError(null);
      setSuccess(null);
      onClose();
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-slate-800 border border-slate-700 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white flex justify-between items-center">
                  Share this Room
                  <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-700"><X size={20} className="text-slate-400" /></button>
                </Dialog.Title>
                <div className="mt-4">
                  <form onSubmit={handleSubmit}>
                    <p className="text-sm text-slate-400 mb-4">Enter the email of the user you want to invite.</p>
                    <div className="flex gap-2">
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                      <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 font-semibold transition-colors disabled:bg-blue-400/50 flex items-center justify-center">
                        {isLoading ? '...' : <Send size={20} />}
                      </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                    {success && <p className="text-green-400 text-sm mt-3">{success}</p>}
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
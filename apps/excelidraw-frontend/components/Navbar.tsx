'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LogOut, Plus, User as UserIcon, DoorOpen } from 'lucide-react';
import Image from "next/image";

interface NavbarProps {
  onNewRoomClick: () => void;
  onJoinRoomClick: () => void; // Prop to handle opening the join modal
  onLogout: () => void;
}

export const Navbar = ({ onNewRoomClick, onJoinRoomClick, onLogout }: NavbarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white/10 backdrop-blur-md shadow-lg sticky top-0 z-20 border-b border-white/20">
      <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-300 transition-colors">
            {/* Assumes logo.svg is in your /public folder */}
            <Image src="/logo.svg" alt="App Logo" width={200} height={80} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Join Room Button */}
          <button
            onClick={onJoinRoomClick}
            className="inline-flex items-center bg-white gap-2 px-4 py-2 font-semibold rounded-lg text-fuchsia-600  hover:bg-fuchsia-600 hover:text-white transition-all shadow-md"
          >
            <DoorOpen size={18} />
            <span className="hidden sm:inline">Join Room</span>
          </button>
          
          {/* New Room Button */}
          <button
            onClick={onNewRoomClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white  text-fuchsia-600  hover:bg-fuchsia-600 hover:text-white  font-semibold rounded-lg transition-all shadow-md"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Room</span>
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-10 w-10 bg-white rounded-full flex items-center justify-center    hover:bg-fuchsia-600 hover:text-white transition-colors"
            >
              <UserIcon size={20} className="text-fuchsia-600" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg border border-slate-700 py-1 z-30">
                <button
                  onClick={() => {
                    onLogout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


'use client';

import { AlertTriangle } from 'lucide-react';

interface AlertModalProps {
  message: string;
}

export const AlertModal = ({ message }: AlertModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 w-full max-w-md shadow-xl text-white flex flex-col items-center text-center">
        <AlertTriangle size={48} className="text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Notice</h2>
        <p className="text-slate-300">
          {message}
        </p>
      </div>
    </div>
  );
};




'use client';

import { ReactNode } from "react";

interface IconButtonProps {
    onClick: () => void;
    activated: boolean;
    icon: ReactNode;
    tooltip?: string;
}

export const IconButton = ({ onClick, activated, icon, tooltip }: IconButtonProps) => {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`p-3 rounded-lg transition-all duration-200 ${
                    activated 
                    ? 'bg-blue-500 text-white scale-110 shadow-lg' 
                    : 'bg-white/30 text-white hover:bg-white/50'
                }`}
            >
                {icon}
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {tooltip}
            </div>
        </div>
    );
};


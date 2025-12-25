"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/contexts/SocketContext'; // Ensure this path is correct
import { useAuth } from '@/contexts/AuthContext';
// Import icons if needed, using simple SVGs for now

export default function ChatWidget() {
    const router = useRouter();
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Example state for tracking typing or simple notifications
    // For a full mini-chat, we would need to replicate the conversation list logic here.
    // For this first iteration (MVP), we will make it a "Quick Launcher" with status.

    useEffect(() => {
        if (socket) {
            socket.on('newMessage', (message: any) => {
                // If the message is not from me, increment unread
                if (message.sender_user_id !== user?.id) {
                    setUnreadCount(prev => prev + 1);
                    // Optional: Play sound
                }
            });

            return () => {
                socket.off('newMessage');
            };
        }
    }, [socket, user]);

    if (!user) return null;

    const handleClick = () => {
        // Reset count when opening/navigating
        setUnreadCount(0);
        router.push('/messages');
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Status indicator (optional, maybe too technical for end user) */}
            {/* <div className={`mb-2 text-xs rounded px-2 py-1 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? 'Connecté' : 'Déconnecté'}
        </div> */}

            <button
                onClick={handleClick}
                className="relative bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105"
                title="Ouvrir la messagerie"
            >
                <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}

                {/* Online Status Dot */}
                <span className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </button>
        </div>
    );
}

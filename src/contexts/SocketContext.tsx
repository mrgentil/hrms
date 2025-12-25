"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    markAsRead: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    markAsRead: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/messages/unread-count`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    };

    useEffect(() => {
        if (user && token) {
            fetchUnreadCount();

            const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
                auth: {
                    token: `Bearer ${token}`, // Pass full token with Bearer prefix as backend expects
                },
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                autoConnect: true,
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected');
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            socketInstance.on('newMessage', (message: any) => {
                // Skip if current user is the sender
                if (message.sender_user_id === user.id) return;

                // Check if user is a recipient (either direct or in participants list)
                const isRecipient = message.recipient_user_id === user.id ||
                    (message.conversationParticipants && message.conversationParticipants.includes(user.id));

                if (isRecipient) {
                    setUnreadCount(prev => prev + 1);
                }
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [user, token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, unreadCount, markAsRead: fetchUnreadCount }}>
            {children}
        </SocketContext.Provider>
    );
};

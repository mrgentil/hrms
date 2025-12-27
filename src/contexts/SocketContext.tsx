"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authService } from '@/lib/auth';

import { audioService } from '@/utils/audio';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    unreadCount: number;
    unreadNotificationsCount: number; // Nouveau
    markAsRead: () => void;
    markNotificationsAsRead: () => void; // Nouveau
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    unreadCount: 0,
    unreadNotificationsCount: 0,
    markAsRead: () => { },
    markNotificationsAsRead: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const token = authService.getAccessToken();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!token) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/messages/unread-count`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.data && typeof data.data.count === 'number') {
                    setUnreadCount(data.data.count);
                } else if (data && typeof data.count === 'number') {
                    setUnreadCount(data.count);
                }
            }
        } catch (error) {
            console.error('[SocketContext] Fetch Error:', error);
        }
    };

    const fetchUnreadNotificationsCount = async () => {
        if (!token) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/notifications/count`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.data && typeof data.data.count === 'number') {
                    setUnreadNotificationsCount(data.data.count);
                }
            }
        } catch (error) {
            console.error('[SocketContext] Fetch Notifications Error:', error);
        }
    };

    // Demander la permission pour les notifications push
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    const showPushNotification = (title: string, body: string, icon?: string) => {
        console.log('[SocketContext] Attempting to show push notification:', title, body);
        if (typeof window !== 'undefined' && 'Notification' in window) {
            console.log('[SocketContext] Notification permission status:', Notification.permission);
            if (Notification.permission === 'granted') {
                try {
                    new Notification(title, {
                        body,
                        icon: icon || '/favicon.ico',
                    });
                    console.log('[SocketContext] Push notification displayed');
                } catch (error) {
                    console.error('[SocketContext] Error showing notification:', error);
                }
            } else {
                console.warn('[SocketContext] Push notification blocked (permission not granted)');
            }
        }
    };

    useEffect(() => {
        if (user && token) {
            console.log('[SocketContext] Connecting to socket...');
            fetchUnreadCount();
            fetchUnreadNotificationsCount();

            const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
                auth: {
                    token: `Bearer ${token}`,
                },
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                autoConnect: true,
            });

            socketInstance.on('connect', () => {
                console.log('[SocketContext] Socket connected successfully');
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('[SocketContext] Socket disconnected');
                setIsConnected(false);
            });

            socketInstance.on('newMessage', (message: any) => {
                console.log('[SocketContext] Received newMessage event:', message);
                if (message.sender_user_id === user.id) {
                    console.log('[SocketContext] Message is from self, skipping alert');
                    return;
                }

                const isRecipient = message.recipient_user_id === user.id ||
                    (message.conversationParticipants && message.conversationParticipants.includes(user.id));

                console.log('[SocketContext] Is current user recipient?', isRecipient);

                if (isRecipient) {
                    setUnreadCount(prev => prev + 1);
                    audioService.playNotification();
                    showPushNotification(
                        `Nouveau message de ${message.sender?.full_name || 'un collègue'}`,
                        message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')
                    );
                }
            });

            socketInstance.on('newNotification', (notification: any) => {
                console.log('[SocketContext] Received newNotification event:', notification);
                setUnreadNotificationsCount(prev => prev + 1);
                audioService.playNotification();
                showPushNotification(
                    notification.title || 'Nouvelle notification',
                    notification.message || ''
                );
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
    }, [user]);

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            unreadCount,
            unreadNotificationsCount,
            markAsRead: fetchUnreadCount,
            markNotificationsAsRead: fetchUnreadNotificationsCount
        }}>
            {children}
        </SocketContext.Provider>
    );
};

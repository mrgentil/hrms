import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

// Créer le contexte des notifications
const NotificationContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Fournisseur du contexte des notifications
export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialisation de la connexion Socket.io
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔗 Connected to notification server');
      setIsConnected(true);
      
      // Rejoindre les rooms utilisateur si connecté
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        newSocket.emit('join', {
          userId: user.id,
          role: user.role,
          fullname: user.fullname
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from notification server');
      setIsConnected(false);
    });

    // Écouter les notifications
    newSocket.on('notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      handleNewNotification(notification);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Gestion des nouvelles notifications
  const handleNewNotification = (notification) => {
    // Ajouter à la liste des notifications
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Garder max 50 notifications
    setUnreadCount(prev => prev + 1);

    // Afficher le toast
    showToast(notification);

    // Son de notification (optionnel)
    if (notification.type !== 'system') {
      playNotificationSound();
    }

    // Notification desktop si autorisée
    if (Notification.permission === 'granted' && !document.hasFocus()) {
      showDesktopNotification(notification);
    }
  };

  // Affichage des toasts
  const showToast = (notification) => {
    const toastOptions = {
      position: "top-right",
      autoClose: notification.persistent ? false : 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: `toast-${notification.color || 'info'}`,
    };

    const ToastContent = () => (
      <div className="notification-toast">
        <div className="d-flex align-items-center">
          {notification.icon && (
            <i className={`${notification.icon} mr-2`} style={{ fontSize: '1.2rem' }}></i>
          )}
          <div>
            <strong>{notification.title}</strong>
            <div className="text-sm">{notification.message}</div>
            {notification.action && (
              <button 
                className="btn btn-sm btn-outline-primary mt-1"
                onClick={() => {
                  if (notification.action.url) {
                    window.location.href = notification.action.url;
                  }
                }}
              >
                {notification.action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    );

    switch (notification.color) {
      case 'success':
        toast.success(<ToastContent />, toastOptions);
        break;
      case 'warning':
        toast.warning(<ToastContent />, toastOptions);
        break;
      case 'danger':
        toast.error(<ToastContent />, toastOptions);
        break;
      case 'info':
      default:
        toast.info(<ToastContent />, toastOptions);
        break;
    }
  };

  // Son de notification
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (error) {
      console.log('Notification sound not available');
    }
  };

  // Notification desktop
  const showDesktopNotification = (notification) => {
    try {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        tag: notification.type,
        requireInteraction: notification.urgent || false
      });
    } catch (error) {
      console.log('Desktop notifications not supported');
    }
  };

  // Demander permission pour notifications desktop
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Marquer une notification comme lue
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marquer toutes comme lues
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  // Supprimer une notification
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  };

  // Vider toutes les notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Envoyer une notification de test
  const sendTestNotification = () => {
    if (socket) {
      const testNotification = {
        type: 'test',
        title: 'Notification de test',
        message: 'Ceci est une notification de test pour vérifier le système',
        icon: 'fas fa-vial',
        color: 'info'
      };
      handleNewNotification(testNotification);
    }
  };

  const value = {
    socket,
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission,
    sendTestNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

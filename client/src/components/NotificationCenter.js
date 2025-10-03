import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import moment from 'moment';

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    sendTestNotification
  } = useNotifications();

  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type) => {
    const iconMap = {
      leave_request: 'fas fa-calendar-alt',
      leave_response: 'fas fa-calendar-check',
      payroll: 'fas fa-money-bill-wave',
      system: 'fas fa-cog',
      birthday: 'fas fa-birthday-cake',
      new_employee: 'fas fa-user-plus',
      expense: 'fas fa-receipt',
      announcement: 'fas fa-bullhorn',
      reminder: 'fas fa-bell',
      security: 'fas fa-shield-alt',
      test: 'fas fa-vial'
    };
    return iconMap[type] || 'fas fa-info-circle';
  };

  // Obtenir la couleur selon le type
  const getNotificationColor = (notification) => {
    if (notification.color) return notification.color;
    
    const colorMap = {
      leave_request: 'info',
      leave_response: notification.message.includes('approuvée') ? 'success' : 'danger',
      payroll: 'success',
      system: 'secondary',
      birthday: 'warning',
      new_employee: 'info',
      expense: 'warning',
      announcement: 'primary',
      reminder: 'warning',
      security: 'danger',
      test: 'info'
    };
    return colorMap[notification.type] || 'info';
  };

  return (
    <div className="notification-center">
      {/* Icône de notification dans la navbar */}
      <div className="nav-item dropdown">
        <a
          className="nav-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setShowDropdown(!showDropdown);
          }}
          style={{ position: 'relative', cursor: 'pointer' }}
        >
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <span 
              className="badge badge-danger navbar-badge"
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                fontSize: '0.7rem',
                minWidth: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {/* Indicateur de connexion */}
          <span
            className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`}
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#28a745' : '#dc3545'
            }}
          ></span>
        </a>

        {/* Dropdown des notifications */}
        {showDropdown && (
          <div 
            className="dropdown-menu dropdown-menu-lg dropdown-menu-right show"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              zIndex: 1000,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              boxShadow: '0 0.5rem 1rem var(--card-shadow)',
              minWidth: '350px',
              maxHeight: '500px',
              overflowY: 'auto'
            }}
          >
            {/* En-tête */}
            <div className="dropdown-header d-flex justify-content-between align-items-center">
              <span>
                <i className="fas fa-bell mr-2"></i>
                Notifications ({unreadCount} non lues)
              </span>
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary mr-1"
                  onClick={sendTestNotification}
                  title="Test notification"
                >
                  <i className="fas fa-vial"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  title="Marquer tout comme lu"
                >
                  <i className="fas fa-check-double"></i>
                </button>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            {/* Filtres */}
            <div className="px-3 py-2">
              <div className="btn-group btn-group-sm w-100" role="group">
                <button
                  type="button"
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('all')}
                >
                  Toutes ({notifications.length})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('unread')}
                >
                  Non lues ({unreadCount})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'read' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('read')}
                >
                  Lues ({notifications.length - unreadCount})
                </button>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            {/* Liste des notifications */}
            <div className="notifications-list">
              {filteredNotifications.length === 0 ? (
                <div className="dropdown-item text-center text-muted py-4">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <div>Aucune notification</div>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`dropdown-item notification-item ${!notification.read ? 'unread' : ''}`}
                    style={{
                      borderLeft: `4px solid var(--${getNotificationColor(notification)})`,
                      backgroundColor: !notification.read ? 'var(--bg-secondary)' : 'transparent',
                      cursor: 'pointer',
                      padding: '0.75rem 1rem'
                    }}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.action && notification.action.url) {
                        window.location.href = notification.action.url;
                        setShowDropdown(false);
                      }
                    }}
                  >
                    <div className="d-flex">
                      <div className="flex-shrink-0 mr-3">
                        <i 
                          className={getNotificationIcon(notification.type)}
                          style={{ 
                            color: `var(--${getNotificationColor(notification)})`,
                            fontSize: '1.2rem'
                          }}
                        ></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="mb-1" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {notification.title}
                          </h6>
                          <div className="d-flex align-items-center">
                            <small className="text-muted mr-2">
                              {moment(notification.timestamp).fromNow()}
                            </small>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              style={{ padding: '0.125rem 0.25rem' }}
                            >
                              <i className="fas fa-times" style={{ fontSize: '0.75rem' }}></i>
                            </button>
                          </div>
                        </div>
                        <p className="mb-1" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {notification.message}
                        </p>
                        {notification.action && (
                          <small>
                            <i className="fas fa-external-link-alt mr-1"></i>
                            {notification.action.label}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pied de page */}
            {notifications.length > 0 && (
              <>
                <div className="dropdown-divider"></div>
                <div className="dropdown-footer text-center">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      clearAllNotifications();
                      setShowDropdown(false);
                    }}
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Tout supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Overlay pour fermer le dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;


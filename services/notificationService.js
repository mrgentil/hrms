/**
 * Service de Notifications en Temps Réel
 * Gère l'envoi de notifications via WebSocket
 */

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Envoie une notification à un utilisateur spécifique
   */
  sendToUser(userId, notification) {
    this.io.to(`user_${userId}`).emit('notification', {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    });
    console.log(`📤 Notification sent to user ${userId}:`, notification.title);
  }

  /**
   * Envoie une notification à tous les utilisateurs d'un rôle
   */
  sendToRole(role, notification) {
    this.io.to(`role_${role}`).emit('notification', {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    });
    console.log(`📤 Notification sent to role ${role}:`, notification.title);
  }

  /**
   * Envoie une notification à tous les utilisateurs connectés
   */
  sendToAll(notification) {
    this.io.emit('notification', {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    });
    console.log(`📤 Broadcast notification:`, notification.title);
  }

  /**
   * Types de notifications prédéfinis
   */
  
  // Notifications RH
  sendLeaveRequestNotification(managerId, employeeName, leaveType) {
    this.sendToUser(managerId, {
      type: 'leave_request',
      title: 'Nouvelle demande de congé',
      message: `${employeeName} a soumis une demande de ${leaveType}`,
      icon: 'fas fa-calendar-alt',
      color: 'info',
      action: {
        label: 'Voir la demande',
        url: '/application-list'
      }
    });
  }

  sendLeaveApprovalNotification(employeeId, status, leaveType) {
    const isApproved = status === 'approved';
    this.sendToUser(employeeId, {
      type: 'leave_response',
      title: `Demande de congé ${isApproved ? 'approuvée' : 'rejetée'}`,
      message: `Votre demande de ${leaveType} a été ${isApproved ? 'approuvée' : 'rejetée'}`,
      icon: isApproved ? 'fas fa-check-circle' : 'fas fa-times-circle',
      color: isApproved ? 'success' : 'danger',
      action: {
        label: 'Voir mes demandes',
        url: '/application-list'
      }
    });
  }

  // Notifications de paie
  sendPayrollNotification(employeeId, month, amount) {
    this.sendToUser(employeeId, {
      type: 'payroll',
      title: 'Fiche de paie disponible',
      message: `Votre fiche de paie pour ${month} (${amount}€) est disponible`,
      icon: 'fas fa-money-bill-wave',
      color: 'success',
      action: {
        label: 'Voir la fiche',
        url: '/salary-view'
      }
    });
  }

  // Notifications système
  sendSystemNotification(title, message, type = 'info') {
    this.sendToAll({
      type: 'system',
      title,
      message,
      icon: 'fas fa-info-circle',
      color: type,
      persistent: true
    });
  }

  // Notifications d'anniversaire
  sendBirthdayNotification(employeeName) {
    this.sendToRole('ROLE_ADMIN', {
      type: 'birthday',
      title: 'Anniversaire aujourd\'hui',
      message: `C'est l'anniversaire de ${employeeName} !`,
      icon: 'fas fa-birthday-cake',
      color: 'warning',
      celebratory: true
    });
  }

  // Notifications de nouveaux employés
  sendNewEmployeeNotification(employeeName, department) {
    this.sendToRole('ROLE_ADMIN', {
      type: 'new_employee',
      title: 'Nouvel employé',
      message: `${employeeName} a rejoint le département ${department}`,
      icon: 'fas fa-user-plus',
      color: 'info',
      action: {
        label: 'Voir le profil',
        url: '/employee-list'
      }
    });
  }

  // Notifications de dépenses
  sendExpenseNotification(managerId, employeeName, amount, category) {
    this.sendToUser(managerId, {
      type: 'expense',
      title: 'Nouvelle note de frais',
      message: `${employeeName} a soumis une note de frais de ${amount}€ (${category})`,
      icon: 'fas fa-receipt',
      color: 'warning',
      action: {
        label: 'Approuver',
        url: '/expense'
      }
    });
  }

  // Notifications d'annonces
  sendAnnouncementNotification(title, department = null) {
    const target = department ? `role_${department}` : 'all';
    const notification = {
      type: 'announcement',
      title: 'Nouvelle annonce',
      message: title,
      icon: 'fas fa-bullhorn',
      color: 'primary',
      action: {
        label: 'Lire l\'annonce',
        url: '/announcement'
      }
    };

    if (department) {
      this.sendToRole(department, notification);
    } else {
      this.sendToAll(notification);
    }
  }

  // Notifications de rappel
  sendReminderNotification(userId, title, message, dueDate) {
    this.sendToUser(userId, {
      type: 'reminder',
      title: `Rappel: ${title}`,
      message: `${message} - Échéance: ${dueDate}`,
      icon: 'fas fa-bell',
      color: 'warning',
      urgent: true
    });
  }

  // Notifications de sécurité
  sendSecurityNotification(userId, action, ip) {
    this.sendToUser(userId, {
      type: 'security',
      title: 'Activité de sécurité',
      message: `${action} détectée depuis ${ip}`,
      icon: 'fas fa-shield-alt',
      color: 'danger',
      persistent: true
    });
  }
}

module.exports = NotificationService;

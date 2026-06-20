import { Injectable } from '@nestjs/common';

export interface UserPresence {
  userId: number;
  socketId: string;
  connectedAt: Date;
  lastPing: Date;
}

@Injectable()
export class PresenceService {
  private connectedUsers = new Map<number, UserPresence>();

  setOnline(userId: number, socketId: string): void {
    this.connectedUsers.set(userId, {
      userId,
      socketId,
      connectedAt: new Date(),
      lastPing: new Date(),
    });
  }

  setOffline(userId: number): void {
    this.connectedUsers.delete(userId);
  }

  updatePing(userId: number): void {
    const presence = this.connectedUsers.get(userId);
    if (presence) {
      presence.lastPing = new Date();
    }
  }

  isOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  getOnlineUserIds(): number[] {
    return Array.from(this.connectedUsers.keys());
  }

  getOnlineCount(): number {
    return this.connectedUsers.size;
  }

  getPresence(userId: number): UserPresence | undefined {
    return this.connectedUsers.get(userId);
  }

  getAllPresences(): UserPresence[] {
    return Array.from(this.connectedUsers.values());
  }
}

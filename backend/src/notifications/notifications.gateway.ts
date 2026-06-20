import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PresenceService } from '../common/gateways/presence.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly presenceService: PresenceService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET || 'fallback_secret_change_me',
            });
            client.data.user = payload;
            const userId = payload.sub;

            // Join personal room for direct notifications
            client.join(`user_${userId}`);

            // Track online presence
            this.presenceService.setOnline(userId, client.id);

            // Broadcast to everyone that this user is now online
            this.server.emit('userOnline', {
                userId,
                onlineUsers: this.presenceService.getOnlineUserIds(),
            });

            // Send current online users list to the newly connected client
            client.emit('onlineUsers', this.presenceService.getOnlineUserIds());

            console.log(`[Notifications] Client connected: ${client.id} (User: ${userId})`);
        } catch (e) {
            console.warn(`[Notifications] Rejected connection: ${e.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.user?.sub;
        if (userId) {
            this.presenceService.setOffline(userId);

            // Broadcast that user went offline
            this.server.emit('userOffline', {
                userId,
                onlineUsers: this.presenceService.getOnlineUserIds(),
            });

            console.log(`[Notifications] Client disconnected: ${client.id} (User: ${userId})`);
        }
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket) {
        const userId = client.data?.user?.sub;
        if (userId) {
            this.presenceService.updatePing(userId);
        }
        client.emit('pong', { timestamp: new Date().toISOString() });
    }

    @SubscribeMessage('getOnlineUsers')
    handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
        client.emit('onlineUsers', this.presenceService.getOnlineUserIds());
    }

    /** Emit a notification to a specific user's room */
    emitNotification(userId: number, notification: any) {
        this.server.to(`user_${userId}`).emit('newNotification', notification);
    }

    /** Emit an event to all connected clients */
    broadcastEvent(event: string, data: any) {
        this.server.emit(event, data);
    }

    /** Emit to a specific room (department, project, etc.) */
    emitToRoom(room: string, event: string, data: any) {
        this.server.to(room).emit(event, data);
    }

    private extractToken(client: Socket): string | undefined {
        // Support both Authorization header and query param (for browser EventSource)
        const authHeader = client.handshake.headers.authorization;
        if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type === 'Bearer' && token) return token;
        }
        const queryToken = client.handshake.query?.token as string;
        return queryToken || undefined;
    }
}

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { PresenceService } from '../common/gateways/presence.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly messagesService: MessagesService,
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

            // Join personal room for direct messages & notifications
            client.join(`user_${userId}`);

            console.log(`[Messages] Client connected: ${client.id} (User: ${userId})`);
        } catch (e) {
            console.warn(`[Messages] Rejected connection: ${e.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.user?.sub;
        console.log(`[Messages] Client disconnected: ${client.id} (User: ${userId ?? 'unknown'})`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
        client.join(room);
        console.log(`[Messages] Client ${client.id} joined room ${room}`);
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
        client.leave(room);
        console.log(`[Messages] Client ${client.id} left room ${room}`);
    }

    @SubscribeMessage('joinConversation')
    handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: number,
    ) {
        const room = `conversation_${conversationId}`;
        client.join(room);
        console.log(`[Messages] Client ${client.id} joined ${room}`);
    }

    @SubscribeMessage('leaveConversation')
    handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() conversationId: number,
    ) {
        client.leave(`conversation_${conversationId}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: number; content: string },
    ) {
        const userId = client.data.user.sub;

        // Save the message and get participants back
        const message: any = await this.messagesService.sendMessage(userId, {
            conversation_id: payload.conversationId,
            content: payload.content,
        });

        // Emit to the conversation room (those who have it open)
        this.server
            .to(`conversation_${payload.conversationId}`)
            .emit('newMessage', message);

        // Notify EACH participant via their personal room (for badge count / push-like)
        if (message.conversationParticipants) {
            message.conversationParticipants.forEach((pId: number) => {
                if (pId !== userId) {
                    this.server.to(`user_${pId}`).emit('newMessage', message);
                }
            });
        }
    }

    @SubscribeMessage('markRead')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: number },
    ) {
        const userId = client.data.user.sub;
        // Emit read receipt to the conversation room
        this.server.to(`conversation_${payload.conversationId}`).emit('messagesRead', {
            userId,
            conversationId: payload.conversationId,
            readAt: new Date().toISOString(),
        });
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: number; isTyping: boolean },
    ) {
        const userId = client.data.user.sub;
        // Broadcast typing status to others in the conversation
        client.to(`conversation_${payload.conversationId}`).emit('userTyping', {
            userId,
            conversationId: payload.conversationId,
            isTyping: payload.isTyping,
        });
    }

    @SubscribeMessage('checkOnline')
    handleCheckOnline(
        @ConnectedSocket() client: Socket,
        @MessageBody() userIds: number[],
    ) {
        const onlineStatus = userIds.reduce((acc, uid) => {
            acc[uid] = this.presenceService.isOnline(uid);
            return acc;
        }, {} as Record<number, boolean>);

        client.emit('onlineStatus', onlineStatus);
    }

    private extractToken(client: Socket): string | undefined {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader) {
            const [type, token] = authHeader.split(' ');
            if (type === 'Bearer' && token) return token;
        }
        const queryToken = client.handshake.query?.token as string;
        return queryToken || undefined;
    }
}

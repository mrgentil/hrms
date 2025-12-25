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
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly messagesService: MessagesService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            client.data.user = payload;

            // Rejoindre une room personnelle pour les notifications directes
            client.join(`user_${payload.sub}`);
            console.log(`Client connected: ${client.id} (User: ${payload.sub})`);
        } catch (e) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
        client.join(room);
        console.log(`Client ${client.id} joined room ${room}`);
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() room: string) {
        client.leave(room);
        console.log(`Client ${client.id} left room ${room}`);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: number; content: string },
    ) {
        const userId = client.data.user.sub;

        // Sauvegarder le message
        // Sauvegarder le message et récupérer les participants
        const message: any = await this.messagesService.sendMessage(userId, {
            conversation_id: payload.conversationId,
            content: payload.content,
        });

        // Emettre à la room de la conversation (pour ceux qui l'ont ouverte)
        this.server.to(`conversation_${payload.conversationId}`).emit('newMessage', message);

        // Notifier CHAQUE participant via sa room personnelle (pour les notifications globales / non-lus)
        if (message.conversationParticipants) {
            message.conversationParticipants.forEach((pId: number) => {
                this.server.to(`user_${pId}`).emit('newMessage', message);
            });
        }
    }

    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: number; isTyping: boolean },
    ) {
        client.to(`conversation_${payload.conversationId}`).emit('userTyping', {
            userId: client.data.user.sub,
            conversationId: payload.conversationId,
            isTyping: payload.isTyping,
        });
    }

    private extractToken(client: Socket): string | undefined {
        const [type, token] = client.handshake.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}

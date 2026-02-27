import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.onAny((event, ...args) => {
      logger.info(`Message from ${socket.id}: ${event} ${JSON.stringify(args)}`);
    });

    socket.on('ping', () => {
      socket.emit('pong', { type: 'pong', timestamp: new Date().toISOString() });
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

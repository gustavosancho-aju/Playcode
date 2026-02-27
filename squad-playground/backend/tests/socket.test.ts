import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { app } from '../src/server/express';
import { createSocketServer } from '../src/server/socket';

describe('Socket.io server', () => {
  let httpServer: ReturnType<typeof createServer>;
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer(app);
    createSocketServer(httpServer);
    httpServer.listen(0, '127.0.0.1', () => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket?.connected) clientSocket.disconnect();
    httpServer.close(done);
  });

  afterEach(() => {
    if (clientSocket?.connected) clientSocket.disconnect();
  });

  it('accepts WebSocket connections', (done) => {
    clientSocket = ClientIO(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it('responds to ping with pong containing timestamp', (done) => {
    clientSocket = ClientIO(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
    clientSocket.on('connect', () => {
      clientSocket.emit('ping');
    });
    clientSocket.on('pong', (data: { type: string; timestamp: string }) => {
      expect(data.type).toBe('pong');
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
      done();
    });
  });

  it('handles disconnection gracefully', (done) => {
    clientSocket = ClientIO(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
    clientSocket.on('connect', () => {
      clientSocket.disconnect();
      setTimeout(() => {
        expect(clientSocket.connected).toBe(false);
        done();
      }, 100);
    });
  });
});

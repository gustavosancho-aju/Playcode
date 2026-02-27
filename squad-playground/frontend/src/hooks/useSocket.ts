import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useConnectionStore } from '../stores/useConnectionStore';

const SOCKET_URL = 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const setConnected = useConnectionStore((s) => s.setConnected);
  const resetReconnect = useConnectionStore((s) => s.resetReconnect);
  const setLastPong = useConnectionStore((s) => s.setLastPong);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      resetReconnect();
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socket.on('pong', () => {
      setLastPong(Date.now());
    });

    return () => {
      socket.disconnect();
    };
  }, [setConnected, resetReconnect, setLastPong]);

  const sendPing = useCallback(() => {
    socketRef.current?.emit('ping');
  }, []);

  return { sendPing };
}

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useAgentStore } from '../stores/useAgentStore';
import type { AgentId, AgentStatus } from 'shared/types';

const SOCKET_URL = 'http://localhost:3000';

interface PipelineUpdateEvent {
  agent: string;
  status: string;
  message?: string;
  artifactPath?: string;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const setConnected = useConnectionStore((s) => s.setConnected);
  const resetReconnect = useConnectionStore((s) => s.resetReconnect);
  const incrementReconnect = useConnectionStore((s) => s.incrementReconnect);
  const setLastPong = useConnectionStore((s) => s.setLastPong);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
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

    socket.io.on('reconnect_attempt', () => {
      incrementReconnect();
    });

    socket.on('pong', () => {
      setLastPong(Date.now());
    });

    socket.on('pipeline-update', (data: PipelineUpdateEvent) => {
      const agentId = data.agent.toLowerCase() as AgentId;
      useAgentStore.getState().updateAgent(agentId, {
        status: data.status as AgentStatus,
        message: data.message || null,
        artifactPath: data.artifactPath || null,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [setConnected, resetReconnect, incrementReconnect, setLastPong]);

  const sendPing = useCallback(() => {
    socketRef.current?.emit('ping');
  }, []);

  return { sendPing };
}

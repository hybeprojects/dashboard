import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function useWebSocket(onEvent: (event: string, payload: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(url);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket', socket.id);
    });

    socket.on('transfer', (payload) => onEvent('transfer', payload));
    socket.on('notification', (payload) => onEvent('notification', payload));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onEvent]);

  return socketRef.current;
}

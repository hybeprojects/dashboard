import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRef, useEffect } from 'react';

export default function useWebSocket(onEvent: (event: string, payload: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // connect to same origin/relative API by default; fall back to localhost:5000
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(url, {
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('token') : null },
    });
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

import { useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function useWebSocket(onEvent: (event: string, payload: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let socket: Socket | null = null;

    const init = async () => {
      try {
        // read httpOnly cookie cannot be accessed; attempt to read permissive token from document.cookie
        const cookies =
          typeof document !== 'undefined'
            ? document.cookie.split(';').reduce((acc: any, c) => {
                const [k, v] = c.split('=');
                if (!k) return acc;
                acc[k.trim()] = decodeURIComponent((v || '').trim());
                return acc;
              }, {})
            : {};
        const token = cookies['sb-access-token'] || null;

        socket = io(
          url,
          token ? { auth: { token }, withCredentials: true } : { withCredentials: true },
        );

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Connected to socket', socket?.id);
        });

        socket.on('transfer', (payload) => onEvent('transfer', payload));
        socket.on('notification', (payload) => onEvent('notification', payload));
      } catch (e) {
        // fallback: connect without token
        socket = io(url, { withCredentials: true });
        socketRef.current = socket;
      }
    };

    init();

    return () => {
      if (socket) socket.disconnect();
      socketRef.current = null;
    };
  }, [onEvent]);

  return socketRef.current;
}

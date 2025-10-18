import { useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function useWebSocket(onEvent: (event: string, payload: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // connect to same origin/relative API by default; fall back to localhost:5000
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let socket: Socket | null = null;

    const init = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;

        socket = io(url, {
          auth: { token },
          withCredentials: true,
        });

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

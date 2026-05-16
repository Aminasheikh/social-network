'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const s = io({ path: '/socket.io' });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (socket && session?.user?.id) {
      socket.emit('join', session.user.id);
    }
  }, [socket, session]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

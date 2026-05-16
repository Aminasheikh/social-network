'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './SocketProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>
        {children}
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#e2e8f0', border: '1px solid #2a2a3e' } }} />
      </SocketProvider>
    </SessionProvider>
  );
}

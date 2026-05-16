'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiBell, FiHome, FiUser, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useSocket } from './SocketProvider';

export default function Navbar() {
  const { data: session } = useSession();
  const socket = useSocket();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(data => {
      setUnread(data.filter((n: any) => !n.read).length);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', () => setUnread(p => p + 1));
    return () => { socket.off('notification'); };
  }, [socket]);

  return (
    <nav className="sticky top-0 z-50 bg-[#1a1a2e] border-b border-[#2a2a3e] px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/feed" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          SocialNet
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/feed" className="text-gray-300 hover:text-indigo-400 flex items-center gap-1">
            <FiHome /> Feed
          </Link>
          <Link href={`/profile/${session?.user.username}`} className="text-gray-300 hover:text-indigo-400 flex items-center gap-1">
            <FiUser /> Profile
          </Link>
          <Link href="/notifications" className="relative text-gray-300 hover:text-indigo-400 flex items-center gap-1">
            <FiBell />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            Notifications
          </Link>
          <Link href="/settings" className="text-gray-300 hover:text-indigo-400 flex items-center gap-1">
            <FiSettings /> Settings
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-gray-300 hover:text-red-400 flex items-center gap-1">
            <FiLogOut /> Logout
          </button>
        </div>

        <button className="md:hidden text-gray-300" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-3 space-y-2 px-2 pb-3">
          {[
            { href: '/feed', icon: <FiHome />, label: 'Feed' },
            { href: `/profile/${session?.user.username}`, icon: <FiUser />, label: 'Profile' },
            { href: '/notifications', icon: <FiBell />, label: `Notifications${unread > 0 ? ` (${unread})` : ''}` },
            { href: '/settings', icon: <FiSettings />, label: 'Settings' },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-[#2a2a3e]">
              {item.icon} {item.label}
            </Link>
          ))}
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-[#2a2a3e] w-full">
            <FiLogOut /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/components/SocketProvider';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiMessageCircle, FiUserPlus, FiUserCheck, FiBell } from 'react-icons/fi';
import type { Notification } from '@/types';
import toast from 'react-hot-toast';

const icons: Record<string, any> = {
  like: <FiHeart className="text-red-400" />,
  comment: <FiMessageCircle className="text-indigo-400" />,
  friend_request: <FiUserPlus className="text-green-400" />,
  friend_accept: <FiUserCheck className="text-blue-400" />,
};

export default function NotificationsPage() {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(setNotifications);
    fetch('/api/notifications', { method: 'PUT' });
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification', (n: Notification) => setNotifications(p => [n, ...p]));
    return () => { socket.off('notification'); };
  }, [socket]);

  const handleFriendRequest = async (notif: Notification, action: 'accept' | 'reject') => {
    const requests = await fetch('/api/friends?type=requests').then(r => r.json());
    const req = requests.find((r: any) => r.sender?.username === notif.sender?.username);
    if (!req) return;
    const res = await fetch('/api/friends', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: req.id, action }),
    });
    if (res.ok) toast.success(action === 'accept' ? 'Friend request accepted!' : 'Request declined');
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><FiBell /> Notifications</h1>
      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FiBell size={40} className="mx-auto mb-2 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        notifications.map(n => (
          <div key={n.id} className={`bg-[#1a1a2e] border rounded-xl p-4 flex items-start gap-3 ${!n.read ? 'border-indigo-800' : 'border-[#2a2a3e]'}`}>
            <div className="w-9 h-9 rounded-full bg-[#2a2a3e] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {n.sender?.avatar
                ? <Image src={n.sender.avatar} alt={n.sender.name} width={36} height={36} className="object-cover" />
                : n.sender?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {icons[n.type] ?? <FiBell className="text-gray-400" />}
                <p className="text-sm text-gray-300">{n.message}</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              {n.type === 'friend_request' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleFriendRequest(n, 'accept')}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg">Accept</button>
                  <button onClick={() => handleFriendRequest(n, 'reject')}
                    className="px-3 py-1 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-gray-300 text-xs rounded-lg">Decline</button>
                </div>
              )}
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
          </div>
        ))
      )}
    </div>
  );
}

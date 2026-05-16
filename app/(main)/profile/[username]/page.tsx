'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { FiUserPlus, FiUserCheck, FiLock, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import PostCard from '@/components/PostCard';
import toast from 'react-hot-toast';
import type { Post, UserProfile } from '@/types';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile & { isFriend: boolean; friendRequestStatus: string | null } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = async () => {
    const res = await fetch(`/api/users/${username}`);
    if (res.ok) setUser(await res.json());
  };

  const fetchPosts = async () => {
    const res = await fetch(`/api/users/${username}/posts`);
    if (res.ok) { setPosts(await res.json()); setLoading(false); }
  };

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, [username]);

  const sendRequest = async () => {
    if (!user) return;
    setActionLoading(true);
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: user.id }),
    });
    setActionLoading(false);
    if (res.ok) { toast.success('Friend request sent!'); fetchUser(); }
    else toast.error('Failed to send request');
  };

  if (!user) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-[#1a1a2e] rounded-2xl" />
      <div className="h-20 bg-[#1a1a2e] rounded-2xl" />
    </div>
  );

  const isOwner = session?.user.id === user.id;

  return (
    <div className="space-y-4">
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-900 to-purple-900 relative">
          {user.coverImage && <Image src={user.coverImage} alt="cover" fill className="object-cover" />}
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="w-20 h-20 rounded-full border-4 border-[#1a1a2e] bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {user.avatar
                ? <Image src={user.avatar} alt={user.name} width={80} height={80} className="object-cover" />
                : user.name[0]}
            </div>
            {!isOwner && (
              <button onClick={sendRequest} disabled={actionLoading || !!user.friendRequestStatus || user.isFriend}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 transition">
                {user.isFriend ? <><FiUserCheck /> Friends</> :
                  user.friendRequestStatus === 'sent' ? 'Request Sent' :
                  user.friendRequestStatus === 'received' ? 'Accept Request' :
                  <><FiUserPlus /> Add Friend</>}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            {user.isPrivate && <FiLock className="text-gray-500" size={14} />}
          </div>
          <p className="text-gray-500 text-sm">@{user.username}</p>
          {user.bio && <p className="text-gray-300 mt-2 text-sm">{user.bio}</p>}
          <div className="flex items-center gap-1 text-gray-600 text-xs mt-2">
            <FiCalendar size={12} />
            <span>Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
          </div>

          <div className="flex gap-4 mt-3 text-sm">
            <span><strong className="text-white">{user._count?.posts ?? 0}</strong> <span className="text-gray-500">posts</span></span>
            <span><strong className="text-white">{user._count?.friends ?? 0}</strong> <span className="text-gray-500">friends</span></span>
          </div>
        </div>
      </div>

      {user.isPrivate && !user.isFriend && !isOwner ? (
        <div className="text-center py-12 text-gray-500">
          <FiLock size={32} className="mx-auto mb-2" />
          <p>This account is private</p>
        </div>
      ) : loading ? (
        <p className="text-center text-gray-500">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No posts yet</p>
      ) : (
        posts.map(p => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}

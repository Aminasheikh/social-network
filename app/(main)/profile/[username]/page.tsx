'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { FiUserPlus, FiUserCheck, FiLock, FiCalendar, FiGrid, FiUsers, FiEdit2 } from 'react-icons/fi';
import { format } from 'date-fns';
import PostCard from '@/components/PostCard';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Post, UserProfile } from '@/types';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfile & { isFriend: boolean; friendRequestStatus: string | null } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'friends'>('posts');

  const fetchUser = async () => {
    const res = await fetch(`/api/users/${username}`);
    if (res.ok) setUser(await res.json());
  };

  const fetchPosts = async () => {
    const res = await fetch(`/api/users/${username}/posts`);
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  };

  const fetchFriends = async () => {
    const res = await fetch('/api/friends?type=friends');
    if (res.ok) setFriends(await res.json());
  };

  useEffect(() => {
    fetchUser();
    fetchPosts();
    fetchFriends();
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
    <div className="animate-pulse space-y-4">
      <div className="h-48 bg-[#1a1a2e] rounded-2xl" />
      <div className="h-32 bg-[#1a1a2e] rounded-2xl" />
    </div>
  );

  const isOwner = session?.user.id === user.id;
  const canSeePosts = !user.isPrivate || user.isFriend || isOwner;

  return (
    <div className="space-y-4">
      {/* Cover + Avatar */}
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-48 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 relative">
          {user.coverImage && (
            <Image src={user.coverImage} alt="cover" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 mb-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-4 border-[#1a1a2e] bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-xl">
              {user.avatar
                ? <Image src={user.avatar} alt={user.name} width={96} height={96} className="object-cover w-full h-full" />
                : user.name[0].toUpperCase()}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:mb-0">
              {isOwner ? (
                <Link href="/settings"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white text-sm font-semibold transition">
                  <FiEdit2 size={14} /> Edit Profile
                </Link>
              ) : (
                <button onClick={sendRequest}
                  disabled={actionLoading || !!user.friendRequestStatus || user.isFriend}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60 transition shadow-lg shadow-indigo-900/30">
                  {user.isFriend
                    ? <><FiUserCheck size={16} /> Friends</>
                    : user.friendRequestStatus === 'sent' ? 'Request Sent'
                    : user.friendRequestStatus === 'received' ? 'Accept Request'
                    : <><FiUserPlus size={16} /> Add Friend</>}
                </button>
              )}
            </div>
          </div>

          {/* Name & Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              {user.isPrivate && <FiLock className="text-gray-500" size={16} title="Private account" />}
            </div>
            <p className="text-indigo-400 text-sm font-medium">@{user.username}</p>
            {user.bio && <p className="text-gray-300 text-sm mt-2 max-w-lg">{user.bio}</p>}
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
              <FiCalendar size={12} />
              <span>Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-[#2a2a3e]">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user._count?.posts ?? 0}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{user._count?.friends ?? 0}</p>
              <p className="text-xs text-gray-500">Friends</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      {!canSeePosts ? (
        <div className="text-center py-16 bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl text-gray-500">
          <FiLock size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">This account is private</p>
          <p className="text-sm mt-1">Add as friend to see their posts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Friends sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FiUsers size={16} className="text-indigo-400" /> Friends
              </h3>
              {friends.length === 0 ? (
                <p className="text-gray-600 text-sm">No friends yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {friends.slice(0, 9).map((f: any) => (
                    <Link key={f.id} href={`/profile/${f.username}`} className="group text-center">
                      <div className="w-full aspect-square rounded-xl bg-indigo-700 flex items-center justify-center text-white font-bold overflow-hidden mb-1 group-hover:ring-2 ring-indigo-500 transition">
                        {f.avatar
                          ? <Image src={f.avatar} alt={f.name} width={64} height={64} className="object-cover w-full h-full" />
                          : f.name[0]}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{f.name.split(' ')[0]}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Posts */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-1">
              <button onClick={() => setActiveTab('posts')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'posts' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <FiGrid size={14} /> Posts
              </button>
              <button onClick={() => setActiveTab('friends')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'friends' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <FiUsers size={14} /> Friends
              </button>
            </div>

            {activeTab === 'posts' && (
              loading ? (
                <p className="text-center text-gray-500 py-8">Loading posts...</p>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl text-gray-500">
                  <FiGrid size={36} className="mx-auto mb-2 opacity-30" />
                  <p>No posts yet</p>
                </div>
              ) : (
                posts.map(p => <PostCard key={p.id} post={p} />)
              )
            )}

            {activeTab === 'friends' && (
              <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4">
                {friends.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No friends yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {friends.map((f: any) => (
                      <Link key={f.id} href={`/profile/${f.username}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f0f] hover:bg-[#2a2a3e] transition">
                        <div className="w-12 h-12 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                          {f.avatar
                            ? <Image src={f.avatar} alt={f.name} width={48} height={48} className="object-cover w-full h-full" />
                            : f.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{f.name}</p>
                          <p className="text-gray-500 text-xs">@{f.username}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

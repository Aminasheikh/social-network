'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/components/SocketProvider';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import Link from 'next/link';
import { FiUserPlus, FiUsers } from 'react-icons/fi';
import type { Post } from '@/types';

function Sidebar() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/friends?type=requests').then(r => r.json()).then(setRequests);
    fetch('/api/friends?type=friends').then(r => r.json()).then(setFriends);
  }, []);

  const respond = async (requestId: string, action: 'accept' | 'reject') => {
    await fetch('/api/friends', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    });
    setRequests(r => r.filter(x => x.id !== requestId));
    if (action === 'accept') {
      fetch('/api/friends?type=friends').then(r => r.json()).then(setFriends);
    }
  };

  return (
    <div className="space-y-4 sticky top-20">
      {/* My Profile Card */}
      {session && (
        <Link href={`/profile/${session.user.username}`}
          className="block bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4 hover:border-indigo-700 transition">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
              {session.user.avatar
                ? <img src={session.user.avatar} alt={session.user.name} className="w-full h-full object-cover" />
                : session.user.name?.[0]}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{session.user.name}</p>
              <p className="text-indigo-400 text-xs">@{session.user.username}</p>
            </div>
          </div>
        </Link>
      )}

      {/* Friend Requests */}
      {requests.length > 0 && (
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <FiUserPlus size={14} className="text-indigo-400" /> Friend Requests
            <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5">{requests.length}</span>
          </h3>
          <div className="space-y-3">
            {requests.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                  {r.sender.avatar
                    ? <img src={r.sender.avatar} alt={r.sender.name} className="w-full h-full object-cover" />
                    : r.sender.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{r.sender.name}</p>
                  <div className="flex gap-1 mt-1">
                    <button onClick={() => respond(r.id, 'accept')}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition">
                      Accept
                    </button>
                    <button onClick={() => respond(r.id, 'reject')}
                      className="px-2 py-0.5 bg-[#2a2a3e] hover:bg-[#3a3a4e] text-gray-300 text-xs rounded-lg transition">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 && (
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <FiUsers size={14} className="text-indigo-400" /> Friends
          </h3>
          <div className="space-y-2">
            {friends.slice(0, 6).map((f: any) => (
              <Link key={f.id} href={`/profile/${f.username}`}
                className="flex items-center gap-2 hover:bg-[#2a2a3e] rounded-xl p-1.5 transition">
                <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                  {f.avatar
                    ? <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                    : f.name[0]}
                </div>
                <div>
                  <p className="text-white text-xs font-medium">{f.name}</p>
                  <p className="text-gray-500 text-xs">@{f.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const socket = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (c?: string | null) => {
    const url = c ? `/api/posts?cursor=${c}` : '/api/posts';
    const res = await fetch(url);
    const data = await res.json();
    setPosts(p => c ? [...p, ...data.posts] : data.posts);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_post', (post: Post) => setPosts(p => [post, ...p]));
    return () => { socket.off('new_post'); };
  }, [socket]);

  useEffect(() => {
    if (!bottomRef.current || !hasMore) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && cursor) fetchPosts(cursor);
    });
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [cursor, hasMore, fetchPosts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Feed */}
      <div className="lg:col-span-2 space-y-4">
        <CreatePost onCreated={() => fetchPosts()} />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#2a2a3e]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-[#2a2a3e] rounded w-1/4" />
                    <div className="h-2 bg-[#2a2a3e] rounded w-1/6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-[#2a2a3e] rounded" />
                  <div className="h-3 bg-[#2a2a3e] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl text-gray-500">
            <p className="text-lg">No posts yet</p>
            <p className="text-sm mt-1">Add friends or create your first post!</p>
          </div>
        ) : (
          posts.map(p => <PostCard key={p.id} post={p} onUpdate={() => fetchPosts()} />)
        )}

        <div ref={bottomRef} className="h-4" />
        {!hasMore && posts.length > 0 && (
          <p className="text-center text-gray-600 text-sm py-4">You've seen all posts</p>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Sidebar />
      </div>
    </div>
  );
}

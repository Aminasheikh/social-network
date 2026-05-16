'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/components/SocketProvider';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import type { Post } from '@/types';

export default function FeedPage() {
  const socket = useSocket();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
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
    socket.on('new_post', (post: Post) => {
      setPosts(p => [post, ...p]);
    });
    return () => { socket.off('new_post'); };
  }, [socket]);

  useEffect(() => {
    if (!bottomRef.current || !hasMore) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && cursor) fetchPosts(cursor);
    });
    observerRef.current.observe(bottomRef.current);
    return () => observerRef.current?.disconnect();
  }, [cursor, hasMore, fetchPosts]);

  return (
    <div className="space-y-4">
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
        <div className="text-center py-16 text-gray-500">
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
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FiSend } from 'react-icons/fi';
import { useSocket } from './SocketProvider';
import type { Comment } from '@/types';

export default function CommentSection({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const socket = useSocket();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`).then(r => r.json()).then(setComments);
  }, [postId]);

  useEffect(() => {
    if (!socket) return;
    socket.on(`comments:${postId}`, (c: Comment) => setComments(p => [...p, c]));
    return () => { socket.off(`comments:${postId}`); };
  }, [socket, postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
    setText('');
    setLoading(false);
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2">
            <Link href={`/profile/${c.author.username}`}>
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                {c.author.avatar
                  ? <img src={c.author.avatar} alt={c.author.name} className="w-full h-full object-cover" />
                  : c.author.name[0]}
              </div>
            </Link>
            <div className="bg-[#0f0f0f] rounded-xl px-3 py-2 flex-1">
              <Link href={`/profile/${c.author.username}`} className="text-xs font-semibold text-indigo-400">{c.author.name}</Link>
              <p className="text-sm text-gray-300">{c.content}</p>
              <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-600 text-sm text-center">No comments yet</p>}
      </div>
      {session && (
        <form onSubmit={submit} className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment..."
            className="flex-1 bg-[#0f0f0f] border border-[#2a2a3e] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
          <button type="submit" disabled={loading || !text.trim()}
            className="px-3 py-2 bg-indigo-600 rounded-xl text-white disabled:opacity-50 hover:bg-indigo-700">
            <FiSend />
          </button>
        </form>
      )}
    </div>
  );
}

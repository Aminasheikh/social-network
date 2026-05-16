'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiLock, FiUsers, FiGlobe } from 'react-icons/fi';
import { AiFillHeart } from 'react-icons/ai';
import type { Post } from '@/types';
import CommentSection from './CommentSection';
import toast from 'react-hot-toast';

const privacyIcon = { public: <FiGlobe size={12} />, friends: <FiUsers size={12} />, private: <FiLock size={12} /> };

export default function PostCard({ post, onUpdate }: { post: Post; onUpdate?: () => void }) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(post.likes.some(l => l.userId === session?.user.id));
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);

  const toggleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikeCount(c => prev ? c - 1 : c + 1);
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (!res.ok) { setLiked(prev); setLikeCount(c => prev ? c + 1 : c - 1); toast.error('Failed'); }
  };

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${post.author.username}`}>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0">
            {post.author.avatar
              ? <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
              : post.author.name[0].toUpperCase()}
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${post.author.username}`} className="font-semibold text-white hover:text-indigo-400">
            {post.author.name}
          </Link>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            {privacyIcon[post.privacy as keyof typeof privacyIcon]}
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>

      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden">
          {post.mediaType === 'video'
            ? <video src={post.mediaUrl} controls className="w-full max-h-96 object-cover" />
            : <img src={post.mediaUrl!} alt="media" className="w-full max-h-96 object-cover" />}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-[#2a2a3e]">
        <button onClick={toggleLike} className="flex items-center gap-1 text-sm transition">
          {liked
            ? <AiFillHeart className="text-red-500" size={20} />
            : <FiHeart className="text-gray-400 hover:text-red-400" size={20} />}
          <span className={liked ? 'text-red-400' : 'text-gray-400'}>{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-400 transition">
          <FiMessageCircle size={20} />
          <span>{post._count.comments}</span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}

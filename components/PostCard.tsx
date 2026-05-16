'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageCircle, FiLock, FiUsers, FiGlobe, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = session?.user.id === post.author.id;

  const toggleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    setLikeCount(c => prev ? c - 1 : c + 1);
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (!res.ok) { setLiked(prev); setLikeCount(c => prev ? c + 1 : c - 1); toast.error('Failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      toast.success('Post deleted!');
      setShowDeleteModal(false);
      onUpdate?.();
    } else {
      toast.error('Failed to delete post');
    }
  };

  return (
    <>
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4 space-y-3">
        {/* Header */}
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

          {/* Delete Button - sirf owner ko dikhe */}
          {isOwner && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition"
              title="Delete post"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        {post.content && <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>}

        {/* Media */}
        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden">
            {post.mediaType === 'video'
              ? <video src={post.mediaUrl} controls className="w-full max-h-96 object-cover" />
              : <img src={post.mediaUrl!} alt="media" className="w-full max-h-96 object-cover" />}
          </div>
        )}

        {/* Actions */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6 w-full max-w-sm shadow-2xl">

            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mx-auto mb-4">
              <FiAlertTriangle className="text-red-400" size={28} />
            </div>

            {/* Text */}
            <h3 className="text-white font-bold text-lg text-center mb-2">
              Post Delete Karna Chahte Ho?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Yeh post permanently delete ho jayegi — undo nahi ho sakta!
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-[#2a2a3e] hover:bg-[#3a3a4e] text-white font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiTrash2 size={16} />
                {deleting ? 'Deleting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

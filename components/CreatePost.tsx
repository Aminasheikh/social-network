'use client';
import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiImage, FiVideo, FiGlobe, FiUsers, FiLock, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CreatePost({ onCreated }: { onCreated: () => void }) {
  const { data: session } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [media, setMedia] = useState<{ url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setMedia({ url: data.url, type: data.mediaType });
    else toast.error(data.error);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !media) return;
    setSubmitting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, mediaUrl: media?.url, mediaType: media?.type, privacy }),
    });
    setSubmitting(false);
    if (res.ok) { setContent(''); setMedia(null); toast.success('Posted!'); onCreated(); }
    else toast.error('Failed to post');
  };

  const privacyOptions = [
    { value: 'public', icon: <FiGlobe />, label: 'Public' },
    { value: 'friends', icon: <FiUsers />, label: 'Friends' },
    { value: 'private', icon: <FiLock />, label: 'Only Me' },
  ];

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-4">
      <form onSubmit={submit} className="space-y-3">
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder={`What's on your mind, ${session?.user.name?.split(' ')[0]}?`}
          rows={3}
          className="w-full bg-[#0f0f0f] border border-[#2a2a3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />

        {media && (
          <div className="relative rounded-xl overflow-hidden">
            {media.type === 'video'
              ? <video src={media.url} className="w-full max-h-48 object-cover" />
              : <img src={media.url} alt="preview" className="w-full max-h-48 object-cover" />}
            <button type="button" onClick={() => setMedia(null)}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/80">
              <FiX />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-[#2a2a3e] rounded-lg transition" title="Add image/video">
              {uploading ? <span className="text-xs">...</span> : <FiImage size={20} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/mp4" className="hidden" onChange={handleFile} />

            <select value={privacy} onChange={e => setPrivacy(e.target.value)}
              className="bg-[#0f0f0f] border border-[#2a2a3e] text-gray-400 text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500">
              {privacyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <button type="submit" disabled={submitting || (!content.trim() && !media)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 text-sm">
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

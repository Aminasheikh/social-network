'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiSettings, FiCamera, FiUser, FiLock, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', bio: '', isPrivate: false, avatar: '', coverImage: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (session) {
      fetch(`/api/users/${session.user.username}`).then(r => r.json()).then(u => {
        setForm({ name: u.name || '', bio: u.bio || '', isPrivate: u.isPrivate, avatar: u.avatar || '', coverImage: u.coverImage || '' });
      });
    }
  }, [session]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) return data.url as string;
    toast.error(data.error);
    return null;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setForm(f => ({ ...f, avatar: url }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/users/${session?.user.username}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success('Profile updated!'); await update(); }
    else toast.error('Failed to update');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white flex items-center gap-2"><FiSettings /> Settings</h1>

      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-6 space-y-6">
        <h2 className="font-semibold text-white flex items-center gap-2"><FiUser /> Profile</h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {form.avatar
                ? <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
                : form.name[0] || '?'}
            </div>
            <button type="button" onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1.5 text-white hover:bg-indigo-700">
              <FiCamera size={14} />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
        </div>

        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Display Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#0f0f0f] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
              className="w-full bg-[#0f0f0f] border border-[#2a2a3e] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 resize-none" />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-[#2a2a3e]">
            <div className="flex items-center gap-2">
              <FiLock className="text-gray-400" />
              <div>
                <p className="text-white text-sm font-medium">Private Account</p>
                <p className="text-gray-500 text-xs">Only friends can see your posts</p>
              </div>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
              className={`w-12 h-6 rounded-full transition-colors ${form.isPrivate ? 'bg-indigo-600' : 'bg-[#2a2a3e]'}`}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 transition-transform ${form.isPrivate ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
            <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

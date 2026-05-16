'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { ...form, redirect: false });
    setLoading(false);
    if (res?.error) toast.error('Invalid email or password');
    else router.push('/feed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f0f] via-[#1a1a2e] to-[#0f0f0f]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#1a1a2e] border border-[#2a2a3e] shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SocialNet</h1>
          <p className="text-gray-400 mt-2">Welcome back!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email" required
            className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#2a2a3e] text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password" placeholder="Password" required
            className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#2a2a3e] text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          No account?{' '}
          <Link href="/register" className="text-indigo-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

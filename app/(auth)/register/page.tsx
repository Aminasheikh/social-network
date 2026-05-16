'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) toast.error(data.error || 'Registration failed');
    else { toast.success('Account created! Please login.'); router.push('/login'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f0f] via-[#1a1a2e] to-[#0f0f0f]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#1a1a2e] border border-[#2a2a3e] shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Join SocialNet</h1>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', placeholder: 'Full Name', type: 'text' },
            { key: 'username', placeholder: 'Username', type: 'text' },
            { key: 'email', placeholder: 'Email', type: 'email' },
            { key: 'password', placeholder: 'Password', type: 'password' },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type} placeholder={placeholder} required
              className="w-full px-4 py-3 rounded-xl bg-[#0f0f0f] border border-[#2a2a3e] text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

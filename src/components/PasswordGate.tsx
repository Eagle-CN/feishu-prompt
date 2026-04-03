"use client";

import { useState, useEffect, ReactNode } from "react";

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 检查是否已鉴权（或无需密码）
  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(d => setAuthed(d.authed))
      .catch(() => setAuthed(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthed(true);
      } else {
        setError(data.message || '密码错误');
      }
    } catch {
      setError('请求失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载中
  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 已鉴权
  if (authed) return <>{children}</>;

  // 密码输入页
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <h1 className="text-xl font-bold text-gray-900">灵感库</h1>
          <p className="text-sm text-gray-400 mt-1">请输入访问密码</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="访问密码"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-medium transition-colors"
          >
            {loading ? '验证中...' : '进入'}
          </button>
        </form>
      </div>
    </div>
  );
}

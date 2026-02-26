import { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

export function TokenPrompt() {
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(true); // Start true to avoid flash

  useEffect(() => {
    const savedToken = localStorage.getItem('taskflow_token');
    setHasToken(!!savedToken);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      localStorage.setItem('taskflow_token', token.trim());
      setHasToken(true);
      window.location.reload();
    }
  };

  if (hasToken) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-surface-800">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Key className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold">Welcome to TaskFlow</h2>
          <p className="mt-2 text-sm text-surface-500">
            Enter your API token to get started
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your API token"
            className="w-full rounded-lg border border-surface-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700"
            autoFocus
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Connect
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-surface-400">
          Test token: <code className="rounded bg-surface-100 px-1 py-0.5 dark:bg-surface-700">test-api-token-12345</code>
        </p>
      </div>
    </div>
  );
}

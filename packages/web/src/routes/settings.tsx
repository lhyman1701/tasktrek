import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Moon, Sun, Monitor, Key, Save, Check, Sparkles } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/settings')({
  component: SettingsPage
});

function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const [apiToken, setApiToken] = useState(() => localStorage.getItem('taskflow_token') || '');
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem('taskflow_anthropic_key') || '');
  const [saved, setSaved] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  const handleSaveToken = () => {
    localStorage.setItem('taskflow_token', apiToken);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAnthropicKey = () => {
    localStorage.setItem('taskflow_anthropic_key', anthropicKey);
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor }
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {/* Theme */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="card">
            <label className="text-sm font-medium text-surface-500 mb-3 block">
              Theme
            </label>
            <div className="flex gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-colors',
                    theme === value
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* API Token */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Authentication</h2>
          <div className="card">
            <label className="text-sm font-medium text-surface-500 mb-3 flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Token
            </label>
            <p className="text-sm text-surface-500 mb-3">
              Enter your API token to authenticate with the TaskFlow API.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Enter your API token"
                className="input flex-1"
              />
              <button
                onClick={handleSaveToken}
                className={cn(
                  'btn-primary',
                  saved && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* AI API Key */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">AI Features</h2>
          <div className="card">
            <label className="text-sm font-medium text-surface-500 mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Anthropic API Key
            </label>
            <p className="text-sm text-surface-500 mb-3">
              Enter your Anthropic API key to enable AI features like natural language task creation and the AI assistant.
              Get your key at{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="input flex-1"
              />
              <button
                onClick={handleSaveAnthropicKey}
                className={cn(
                  'btn-primary',
                  aiSaved && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {aiSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <div className="card text-sm text-surface-500">
            <p className="font-medium text-surface-900 dark:text-surface-100">
              TaskFlow v0.1.0
            </p>
            <p className="mt-2">
              AI-powered personal task manager with natural language capabilities.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

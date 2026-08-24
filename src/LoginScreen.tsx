import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/layout/ui';
import { getApiErrorMessage, sendUserName } from '@/lib/api';
import { DEFAULT_LOGIN_JS, runLoginJs } from '@/loginPayload';

const WORDMARK = 'Dashboard';

const PROMPTS = [
  'What changed in branch performance overnight?',
  'Which accounts failed more than usual today?',
  'Where did pending transactions pile up?',
  'Which city showed unusual Success volume?',
];

type PreviewState =
  | { status: 'running'; logs: string[] }
  | { status: 'ok'; json: string; logs: string[] }
  | { status: 'error'; message: string; logs: string[] };

function TypedPrompt() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  const text = PROMPTS[promptIndex]!;
  const shown = text.slice(0, visibleCount);

  useEffect(() => {
    let delay = 42;
    if (phase === 'in' && visibleCount === text.length) delay = 1600;
    if (phase === 'hold') delay = 280;
    if (phase === 'out') delay = visibleCount === 0 ? 320 : 24;

    const t = window.setTimeout(() => {
      if (phase === 'in') {
        if (visibleCount < text.length) setVisibleCount((c) => c + 1);
        else setPhase('hold');
        return;
      }
      if (phase === 'hold') {
        setPhase('out');
        return;
      }
      if (visibleCount > 0) {
        setVisibleCount((c) => c - 1);
        return;
      }
      setPromptIndex((i) => (i + 1) % PROMPTS.length);
      setPhase('in');
    }, delay);

    return () => window.clearTimeout(t);
  }, [phase, visibleCount, text.length]);

  return (
    <p className="min-w-0 flex-1 truncate px-3 text-left text-sm text-content-secondary">
      {shown}
      <span className="ml-px animate-prompt-caret text-content-tertiary">|</span>
    </p>
  );
}

export function LoginScreen() {
  const [source, setSource] = useState(DEFAULT_LOGIN_JS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ status: 'running', logs: [] });

  useEffect(() => {
    let cancelled = false;
    setPreview({ status: 'running', logs: [] });

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const { data, logs } = await runLoginJs(source);
          if (!cancelled) {
            setPreview({ status: 'ok', json: JSON.stringify(data, null, 2), logs });
          }
        } catch (err) {
          if (!cancelled) {
            setPreview({
              status: 'error',
              message: err instanceof Error ? err.message : 'Invalid JS',
              logs: [],
            });
          }
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source]);

  return (
    <div className="flex h-full overflow-auto bg-paper">
      <div className="flex min-h-full w-full flex-col lg:w-1/2">
        <header className="px-8 pt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src="/Image.png" alt="" className="h-8 w-8 rounded-md object-cover" aria-hidden />
              <p className="text-lg font-bold text-content-primary">
                <span className="text-brand-text">{WORDMARK}</span>
              </p>
            </div>
            {/* <Link to="/dashboard" className="text-sm font-medium text-brand-text underline-offset-2 hover:underline">
              Dashboard
            </Link> */}
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center px-8 py-10">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-3xl font-bold text-content-primary">Sign in as Admin</h1>

            <label className="mt-6 block text-xs font-medium text-content-secondary" htmlFor="login-js">
              JavaScript
            </label>
            <textarea
              id="login-js"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setError(null);
              }}
              spellCheck={false}
              className="mt-1.5 h-36 w-full resize-y rounded-md border border-hairline bg-white p-3 font-mono text-xs text-content-primary outline-none focus:border-brand"
            />

            <p className="mt-3 text-xs font-medium text-content-secondary">console</p>
            <pre className="mt-1 max-h-20 overflow-auto rounded-md border border-hairline bg-[#0f172a] p-2 font-mono text-[11px] text-[#e2e8f0]">
              {preview.status === 'running'
                ? 'Running…'
                : preview.logs.length > 0
                  ? preview.logs.join('\n')
                  : preview.status === 'ok'
                    ? '(no logs)'
                    : '—'}
            </pre>

            <p className="mt-3 text-xs font-medium text-content-secondary">Preview JSON</p>
            <pre
              className={`mt-1 max-h-24 overflow-auto rounded-md border border-hairline p-2 font-mono text-[11px] ${
                preview.status === 'ok'
                  ? 'bg-[color-mix(in_srgb,var(--brand)_6%,white)] text-content-secondary'
                  : preview.status === 'error'
                    ? 'bg-[color-mix(in_srgb,var(--status-error)_8%,white)] text-status-error'
                    : 'bg-sunken text-content-tertiary'
              }`}
            >
              {preview.status === 'running'
                ? 'Running…'
                : preview.status === 'ok'
                  ? preview.json
                  : preview.message}
            </pre>

            <Button
              type="button"
              variant="primary"
              rightIcon={ArrowRight}
              className="mt-8 w-full"
              disabled={loading || preview.status !== 'ok'}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const { data } = await runLoginJs(source);
                  await sendUserName(data);
                } catch (err) {
                  setError(getApiErrorMessage(err));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Sending…' : 'Send to server'}
            </Button>

            {error ? (
              <div className="mt-3 rounded-md border border-status-error/30 bg-[color-mix(in_srgb,var(--status-error)_8%,white)] px-3 py-2">
                <p className="text-sm font-medium text-status-error">API request failed</p>
                <p className="mt-1 break-words text-xs leading-relaxed text-content-secondary">{error}</p>
              </div>
            ) : null}
          </div>
        </main>

        <footer className="px-8 pb-8 text-center text-xs text-content-tertiary lg:text-left">
          By continuing, you agree to our Terms of Use and Privacy Policy.
        </footer>
      </div>

      <div className="relative hidden h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-brand lg:flex">
        <img
          src="/bg.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay"
          aria-hidden
        />
        <div className="relative z-10 flex max-w-lg flex-col items-center px-10 text-center text-white">
          <img src="/Image.png" alt="" className="h-16 w-16 rounded-xl object-cover" aria-hidden />
          <p className="mt-8 text-2xl font-bold leading-snug">
            Governed analytics — build, certify, and publish with confidence.
          </p>
          <div className="mt-10 flex h-14 w-full max-w-md items-center gap-2 rounded-full bg-white px-2 py-2 shadow-lg">
            <TypedPrompt />
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-xs">
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

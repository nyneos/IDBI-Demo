import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/layout/ui';
import { getApiErrorMessage, sendUserName } from '@/lib/api';
import { DEFAULT_LOGIN_JS, runLoginJs } from '@/loginPayload';
import { DEFAULT_JS_IDE_OPTIONS, JsIdeEditor, type JsIdeOptions } from '@/JsIdeEditor';

const WORDMARK = 'Dashboard';

type PreviewState =
  | { status: 'running'; logs: string[] }
  | { status: 'ok'; json: string; logs: string[] }
  | { status: 'error'; message: string; logs: string[] };

export function LoginScreen() {
  const [source, setSource] = useState(DEFAULT_LOGIN_JS);
  const [ideOptions, setIdeOptions] = useState<JsIdeOptions>(DEFAULT_JS_IDE_OPTIONS);
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
      <div className="flex min-h-full w-full flex-col">
        <header className="px-8 pt-8">
          <div className="flex items-center gap-2">
            <img src="/Image.png" alt="" className="h-8 w-8 rounded-md object-cover" aria-hidden />
            <p className="text-lg font-bold text-content-primary">
              <span className="text-brand-text">{WORDMARK}</span>
            </p>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-8 py-10">
          <div className="w-full">
            <h1 className="text-3xl font-bold text-content-primary">Sign in as Admin</h1>

            <p className="mt-6 text-xs font-medium text-content-secondary">JavaScript</p>
            <div className="mt-1.5">
              <JsIdeEditor
                value={source}
                onChange={(next) => {
                  setSource(next);
                  setError(null);
                }}
                options={ideOptions}
                onOptionsChange={setIdeOptions}
              />
            </div>

            <p className="mt-3 text-xs font-medium text-content-secondary">console</p>
            <pre className="mt-1 max-h-28 overflow-auto rounded-md border border-hairline bg-[#0f172a] p-2 font-mono text-[11px] text-[#e2e8f0]">
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
              className={`mt-1 max-h-32 overflow-auto rounded-md border border-hairline p-2 font-mono text-[11px] ${
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
              className="mt-8"
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

        <footer className="px-8 pb-8 text-xs text-content-tertiary">
          By continuing, you agree to our Terms of Use and Privacy Policy.
        </footer>
      </div>
    </div>
  );
}

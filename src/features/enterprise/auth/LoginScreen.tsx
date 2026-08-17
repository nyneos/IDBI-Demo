import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ENTERPRISE_FIELD } from '../shared/EnterpriseSection';
import { LoginBrandHeader, LoginHeroPanel } from './LoginHeroPanel';
import { LOGIN_PATHS, type LoginPath } from './loginPaths';
import { useEnterpriseSession } from './useEnterpriseSession';

type Step = 'choose' | 'signin';

export function LoginScreen() {
  const { login, user } = useEnterpriseSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/enterprise/dashboard-builder';

  const [step, setStep] = useState<Step>('choose');
  const [path, setPath] = useState<LoginPath | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const openPath = (next: LoginPath) => {
    setPath(next);
    setEmail(next.email);
    setPassword('');
    setError(null);
    setStep('signin');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = login(email, password);
    if (!ok) {
      setError('Invalid email or password');
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="flex h-full overflow-auto bg-paper">
      <div className="flex min-h-full w-full flex-col lg:w-1/2">
        <header className="px-8 pt-8">
          <LoginBrandHeader />
        </header>

        <main className="flex flex-1 flex-col justify-center px-8 py-10">
          {step === 'choose' ? (
            <div className="mx-auto w-full max-w-md">
              <h1 className="text-3xl font-bold text-content-primary">How will you use Enterprise Suite?</h1>
              <p className="mt-2 text-sm text-content-secondary">Choose a path to continue.</p>
              <ul className="mt-8 flex flex-col gap-4">
                {LOGIN_PATHS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openPath(item)}
                        className="flex w-full items-center gap-4 rounded-full bg-brand px-5 py-4 text-left text-white shadow-xs transition-colors hover:bg-brand-hover active:bg-brand-active"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <Icon size={20} strokeWidth={1.75} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base font-semibold">{item.title}</span>
                          <span className="mt-0.5 block text-sm text-white/85">{item.description}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mx-auto w-full max-w-md">
              <button
                type="button"
                onClick={() => {
                  setStep('choose');
                  setPath(null);
                  setError(null);
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-text"
              >
                <ArrowLeft size={14} aria-hidden />
                Back
              </button>
              <h1 className="mt-4 text-3xl font-bold text-content-primary">{path?.title ?? 'Sign in'}</h1>
              <p className="mt-2 text-sm text-content-secondary">{path?.hint}</p>

              <label className="mt-8 flex flex-col gap-1.5 text-sm font-medium text-content-primary">
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className={ENTERPRISE_FIELD}
                />
              </label>
              <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium text-content-primary">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={ENTERPRISE_FIELD}
                />
              </label>

              {error ? <p className="mt-3 text-sm text-status-error">{error}</p> : null}

              <Button type="submit" variant="primary" rightIcon={ArrowRight} className="mt-6 w-full">
                Continue
              </Button>

              <p className="mt-6 text-xs leading-relaxed text-content-tertiary">
                Demo credentials only — client-side gate, not production authentication.
              </p>
            </form>
          )}
        </main>

        <footer className="px-8 pb-8 text-center text-xs text-content-tertiary lg:text-left">
          By continuing, you agree to our Terms of Use and Privacy Policy.
        </footer>
      </div>

      <LoginHeroPanel />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { NyneOsMark } from '@/components/dashboard-builder/JustAskDialog';
import { PRODUCT_SUFFIX, PRODUCT_WORDMARK } from '@/lib/product';

const PROMPTS = [
  'What changed in branch performance overnight?',
  'Which accounts failed more than usual today?',
  'Where did pending transactions pile up?',
  'Which city showed unusual Success volume?',
];

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

export function LoginHeroPanel() {
  return (
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
  );
}

export function LoginBrandHeader() {
  return (
    <div className="flex items-center gap-2">
      <NyneOsMark className="h-8 w-8 rounded-md" />
      <p className="text-lg font-bold text-content-primary">
        <span className="text-brand-text">{PRODUCT_WORDMARK}</span>
        <span className="ml-1 font-semibold text-content-secondary">{PRODUCT_SUFFIX}</span>
      </p>
    </div>
  );
}
